import * as zmq from "zeromq"
import "dotenv/config";
import { EnvVar, getEnvVar } from "../app"
import { type Reply, type Request, type RequestHeartbeat, type ReplyHeartbeat } from "../types";

const host = getEnvVar(EnvVar.HOST);
const port = getEnvVar(EnvVar.PORT);
const REQUEST_TIMEOUT = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds

// Create DEALER socket for async communication
const sock = new zmq.Dealer({
    receiveTimeout: REQUEST_TIMEOUT,
});

// Track pending requests by message ID
type PendingRequest = {
    resolve: (reply: Reply) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    timestamp: number;
};

const pendingRequests = new Map<number, PendingRequest>();

// Generate unique message ID (timestamp with collision handling)
let lastMsgId = 0;
function generateMsgId(): number {
    const now = Date.now();
    if (now > lastMsgId) {
        lastMsgId = now;
        return now;
    }
    // Handle collision by incrementing
    lastMsgId++;
    return lastMsgId;
}

// Clean up timed-out requests
function cleanupTimedOutRequests() {
    const now = Date.now();
    for (const [msgId, pending] of pendingRequests.entries()) {
        if (now - pending.timestamp > REQUEST_TIMEOUT) {
            clearTimeout(pending.timeout);
            pendingRequests.delete(msgId);
            // Silently ignore - don't reject to avoid noise
        }
    }
}

// Start cleanup interval
const cleanupInterval = setInterval(cleanupTimedOutRequests, 1000); // Check every second

// Connect to server
sock.connect(`tcp://${host}:${port}`);

// Async message receiver loop
(async () => {
    try {
        for await (const message of sock) {
            try {
                // DEALER socket receives just the message (identity is stripped)
                const reply = JSON.parse(message.toString()) as Reply | ReplyHeartbeat;
                
                // Handle heartbeat responses
                if ('cmd' in reply && reply.cmd === 'heartbeat') {
                    const heartbeatReply = reply as ReplyHeartbeat;
                    // Heartbeat received, connection is alive
                    continue;
                }
                
                // Handle regular replies
                if ('msgId' in reply) {
                    const msgId = reply.msgId;
                    const pending = pendingRequests.get(msgId);
                    
                    if (pending) {
                        clearTimeout(pending.timeout);
                        pendingRequests.delete(msgId);
                        pending.resolve(reply as Reply);
                    }
                    // If no pending request found, silently ignore (might be a late response)
                }
            } catch (error) {
                // Ignore parsing errors for now
                console.error(`::: ZeroMQ Client: Error parsing reply:`, error);
            }
        }
    } catch (error) {
        console.error(`::: ZeroMQ Client: Receiver loop error:`, error);
    }
})();

// Heartbeat mechanism
let heartbeatInterval: NodeJS.Timeout | null = null;

function startHeartbeat() {
    if (heartbeatInterval) {
        return; // Already started
    }
    
    heartbeatInterval = setInterval(() => {
        try {
            const heartbeatReq: RequestHeartbeat = {
                cmd: "heartbeat",
                msgId: generateMsgId(),
            };
            // Send heartbeat without tracking (we don't need to wait for response)
            sock.send(JSON.stringify(heartbeatReq)).catch((err) => {
                // Silently ignore heartbeat send errors
            });
        } catch (error) {
            // Silently ignore heartbeat errors
        }
    }, HEARTBEAT_INTERVAL);
}

// Start heartbeat after connection
startHeartbeat();

// Handle connection errors and reconnection
sock.events?.on("disconnect", () => {
    // Clear all pending requests on disconnect
    for (const [msgId, pending] of pendingRequests.entries()) {
        clearTimeout(pending.timeout);
        pendingRequests.delete(msgId);
        pending.reject(new Error(`Connection lost to payment gateway server at ${host}:${port}`));
    }
});

sock.events?.on("connect", () => {
    // Restart heartbeat on reconnect
    if (!heartbeatInterval) {
        startHeartbeat();
    }
});

export async function send(req: Request): Promise<Reply> {
    return new Promise<Reply>((resolve, reject) => {
        // Generate message ID and add to request
        const msgId = generateMsgId();
        const reqWithId = { ...req, msgId };
        
        // Set up timeout
        const timeout = setTimeout(() => {
            pendingRequests.delete(msgId);
            reject(new Error(`Request to blockchain gateway timed out after ${REQUEST_TIMEOUT / 1000} seconds for command: ${req.cmd}`));
        }, REQUEST_TIMEOUT);
        
        // Track pending request
        pendingRequests.set(msgId, {
            resolve,
            reject,
            timeout,
            timestamp: Date.now(),
        });
        
        // Send request
        sock.send(JSON.stringify(reqWithId)).catch((error) => {
            const pending = pendingRequests.get(msgId);
            if (pending) {
                clearTimeout(pending.timeout);
                pendingRequests.delete(msgId);
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Check if it's a connection error - try to reconnect
            if (errorMessage.includes('ENOENT') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('not connected')) {
                try {
                    sock.disconnect(`tcp://${host}:${port}`);
                } catch (e) {
                    // Ignore disconnect errors
                }
                try {
                    sock.connect(`tcp://${host}:${port}`);
                    // Retry the request after reconnection
                    setTimeout(() => {
                        sock.send(JSON.stringify(reqWithId)).catch((retryError) => {
                            reject(new Error(`Failed to communicate with payment gateway server at ${host}:${port}: ${retryError instanceof Error ? retryError.message : String(retryError)}`));
                        });
                    }, 200);
                    return;
                } catch (retryError) {
                    reject(new Error(`Failed to reconnect to payment gateway server at ${host}:${port}: ${retryError instanceof Error ? retryError.message : String(retryError)}`));
                }
            } else {
                reject(new Error(`Failed to communicate with payment gateway server at ${host}:${port}: ${errorMessage}`));
            }
        });
    });
}

// Cleanup on process exit
process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    sock.close();
});

process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    sock.close();
});
