import * as zmq from "zeromq";
import dotenv from "dotenv";
import { EnvVar, getEnvVar, isDev } from "../app";

// Ensure process is available (Node.js global)
declare const process: { exitCode?: number };

if (isDev()) {
    dotenv.config({ quiet: true, debug: false });
}

import { ReplyError, ReplyOk, Request, ReplyHeartbeat } from "../types";
import { SMILEY } from "../emoji";
import { isCascadefundPaymentReq, cascadeFundRep } from "./cascadefund-payment";
import { isAraAllStarsReq, araAllStarsRep } from "./ara-all-stars";


async function run() {
    const port = getEnvVar(EnvVar.PORT);
    const host = getEnvVar(EnvVar.HOST);
    const bindAddress = `tcp://0.0.0.0:${port}`;
    
    console.log(`[DEBUG] Creating ZeroMQ Router socket...`);
    const sock = new zmq.Router();

    // Add event listeners for debugging (if available)
    try {
        if (sock.events) {
            sock.events.on("bind", (address: any) => {
                console.log(`[DEBUG] Socket bound to: ${address}`);
            });

            sock.events.on("accept", (address: any) => {
                console.log(`[DEBUG] Socket accepted connection from: ${address}`);
            });

            sock.events.on("connect", (address: any) => {
                console.log(`[DEBUG] Socket connected to: ${address}`);
            });

            sock.events.on("disconnect", (address: any) => {
                console.log(`[DEBUG] Socket disconnected from: ${address}`);
            });

            sock.events.on("close", () => {
                console.log(`[DEBUG] Socket closed`);
            });

            sock.events.on("error", (error: any) => {
                console.error(`[DEBUG] Socket error:`, error);
            });
        }
    } catch (e) {
        console.log(`[DEBUG] Event listeners not available (this is okay):`, e);
    }

    console.log(`[DEBUG] Attempting to bind to ${bindAddress}...`);
    try {
        await sock.bind(bindAddress);
        console.log(`[DEBUG] Successfully bound to ${bindAddress}`);
    } catch (error) {
        console.error(`[DEBUG] Failed to bind to ${bindAddress}:`, error);
        throw error;
    }
    
    console.log(`${SMILEY} Crypto Sockets available on port ${port}`);
    console.log(`${SMILEY} Connect to crypto sockets by ${host}:${port}`);
    console.log(`[DEBUG] Server is ready and waiting for connections...`);

    // Process requests asynchronously
    for await (const [clientIdentity, msg] of sock) {
        // ROUTER receives [identity, message] as multi-part message
        console.log(`[DEBUG] Received message, length: ${msg.length} bytes`);
        
        // Process request asynchronously (don't block on slow operations)
        (async () => {
            let request: Request;
            try {
                const msgStr = msg.toString();
                console.log(`[DEBUG] Message content: ${msgStr.substring(0, 200)}${msgStr.length > 200 ? '...' : ''}`);
                request = JSON.parse(msgStr) as Request;
                console.log(`[DEBUG] Parsed request - cmd: ${request.cmd}, msgId: ${request.msgId}`);
            } catch (e: any) {
                console.error(`[DEBUG] Error parsing message:`, e);
                const reply: ReplyError = {
                    error: e.toString(),
                    msgId: 0, // Unknown msgId if parsing failed
                    time: Date.now(),
                }
                console.log(`[DEBUG] Sending error reply`);
                // ROUTER sends [identity, message]
                await sock.send([clientIdentity, JSON.stringify(reply)]);
                return;
            }

            // Extract msgId for response correlation (required, should be set by client)
            const msgId = request.msgId ?? 0;

            // Handle heartbeat immediately
            if (request.cmd === "heartbeat") {
                console.log(`[DEBUG] Handling 'heartbeat' command`);
                const reply: ReplyHeartbeat = {
                    cmd: "heartbeat",
                    msgId: msgId,
                    time: Date.now(),
                }
                await sock.send([clientIdentity, JSON.stringify(reply)]);
                console.log(`[DEBUG] Sent 'heartbeat' reply`);
                return;
            }

            if (request.cmd === "hello") {
                console.log(`[DEBUG] Handling 'hello' command`);
                const reply: ReplyOk = {
                    msgId: msgId,
                    time: Date.now(),
                }
                await sock.send([clientIdentity, JSON.stringify(reply)]);
                console.log(`[DEBUG] Sent 'hello' reply`);
                return;
            } else if (isCascadefundPaymentReq(request.cmd)) {
                console.log(`[DEBUG] Handling cascadefund payment request: ${request.cmd}`);
                const reply = await cascadeFundRep(request);
                await sock.send([clientIdentity, JSON.stringify(reply)]);
                console.log(`[DEBUG] Sent cascadefund payment reply`);
                return;
            } else if (isAraAllStarsReq(request.cmd)) {
                console.log(`[DEBUG] Handling ara all stars request: ${request.cmd}`);
                const reply = await araAllStarsRep(request);
                await sock.send([clientIdentity, JSON.stringify(reply)]);
                console.log(`[DEBUG] Sent ara all stars reply`);
                return;
            } else {
                console.log(`[DEBUG] Unsupported command: ${request.cmd}`);
                const reply: ReplyError = {
                    error: `unsupported command`,
                    msgId: msgId,
                    time: Date.now(),
                }
                await sock.send([clientIdentity, JSON.stringify(reply)]);
                console.log(`[DEBUG] Sent unsupported command error reply`);
                return;
            }
        })().catch((error) => {
            console.error(`[DEBUG] Error processing request:`, error);
            // Try to send error reply if we have the identity
            const errorReply: ReplyError = {
                error: error instanceof Error ? error.message : String(error),
                msgId: 0, // Unknown msgId
                time: Date.now(),
            };
            sock.send([clientIdentity, JSON.stringify(errorReply)]).catch((sendError) => {
                console.error(`[DEBUG] Failed to send error reply:`, sendError);
            });
        });
    }
}

run().catch(e => {
    console.error(`[DEBUG] Fatal error in server:`, e);
    console.error(e);
    process.exitCode = 1;
})