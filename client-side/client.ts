import * as zmq from "zeromq"
import "dotenv/config";
import { EnvVar, getEnvVar } from "../app"
import { type Reply, type Request } from "../types";

const sock = new zmq.Request({
    receiveTimeout: 30000, // 30 second timeout
})

const host = getEnvVar(EnvVar.HOST);
const port = getEnvVar(EnvVar.PORT);
sock.connect(`tcp://${host}:${port}`)

// Track if a request is in progress to prevent concurrent sends
let isSending = false;
const sendQueue: Array<{
    req: Request;
    resolve: (reply: Reply) => void;
    reject: (error: Error) => void;
}> = [];

async function processQueue() {
    if (isSending || sendQueue.length === 0) {
        return;
    }

    isSending = true;
    const { req, resolve, reject } = sendQueue.shift()!;

    try {
        await sock.send(JSON.stringify(req));
        const [result] = await sock.receive();
        const reply = JSON.parse(result.toString()) as Reply;
        resolve(reply);
    } catch (error) {
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
                await new Promise(resolve => setTimeout(resolve, 200));
                await sock.send(JSON.stringify(req));
                const [result] = await sock.receive();
                const reply = JSON.parse(result.toString()) as Reply;
                resolve(reply);
                return;
            } catch (retryError) {
                console.error(`::: ZeroMQ Client: Reconnection failed:`, retryError);
            }
        }
        // Check if it's a timeout error
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
            reject(new Error(`Request to blockchain gateway timed out after 30 seconds for command: ${req.cmd}`));
        } else {
            reject(new Error(`Failed to communicate with payment gateway server at ${host}:${port}: ${errorMessage}`));
        }
    } finally {
        isSending = false;
        // Process next item in queue
        if (sendQueue.length > 0) {
            processQueue();
        }
    }
}

export async function send(req: Request): Promise<Reply> {
    return new Promise<Reply>((resolve, reject) => {
        sendQueue.push({ req, resolve, reject });
        processQueue();
    });
}
