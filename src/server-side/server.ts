import * as zmq from "zeromq";
import dotenv from "dotenv";
import { EnvVar, getEnvVar, isDev } from "../app";

// Ensure process is available (Node.js global)
declare const process: { exitCode?: number };

if (isDev()) {
    dotenv.config({ quiet: true, debug: false });
}

import { ReplyError, ReplyOk, Request } from "../types";
import { SMILEY } from "../emoji";
import { isCascadefundPaymentReq, cascadeFundRep } from "./cascadefund-payment";
import { isAraAllStarsReq, araAllStarsRep } from "./ara-all-stars";


async function run() {
    const port = getEnvVar(EnvVar.PORT);
    const host = getEnvVar(EnvVar.HOST);
    const bindAddress = `tcp://0.0.0.0:${port}`;
    
    console.log(`[DEBUG] Creating ZeroMQ Reply socket...`);
    const sock = new zmq.Reply();

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

    for await (const [msg] of sock) {
        console.log(`[DEBUG] Received message, length: ${msg.length} bytes`);
        let request: Request;
        try {
            const msgStr = msg.toString();
            console.log(`[DEBUG] Message content: ${msgStr.substring(0, 200)}${msgStr.length > 200 ? '...' : ''}`);
            request = JSON.parse(msgStr) as Request;
            console.log(`[DEBUG] Parsed request - cmd: ${request.cmd}`);
        } catch (e: any) {
            console.error(`[DEBUG] Error parsing message:`, e);
            const reply: ReplyError = {
                error: e.toString(),
                time: Date.now(),
            }
            console.log(`[DEBUG] Sending error reply`);
            await sock.send(JSON.stringify(reply));
            continue;
        }

        if (request.cmd === "hello") {
            console.log(`[DEBUG] Handling 'hello' command`);
            const reply: ReplyOk = {
                time: Date.now(),
            }
            await sock.send(JSON.stringify(reply));
            console.log(`[DEBUG] Sent 'hello' reply`);
            continue;
        } else if (isCascadefundPaymentReq(request.cmd)) {
            console.log(`[DEBUG] Handling cascadefund payment request: ${request.cmd}`);
            const reply = await cascadeFundRep(request);
            await sock.send(JSON.stringify(reply));
            console.log(`[DEBUG] Sent cascadefund payment reply`);
            continue;
        } else if (isAraAllStarsReq(request.cmd)) {
            console.log(`[DEBUG] Handling ara all stars request: ${request.cmd}`);
            const reply = await araAllStarsRep(request);
            await sock.send(JSON.stringify(reply));
            console.log(`[DEBUG] Sent ara all stars reply`);
            continue;
        } else {
            console.log(`[DEBUG] Unsupported command: ${request.cmd}`);
            const reply: ReplyError = {
                error: `unsupported command`,
                time: Date.now(),
            }
            await sock.send(JSON.stringify(reply));
            console.log(`[DEBUG] Sent unsupported command error reply`);
            continue;
        }
    }
}

run().catch(e => {
    console.error(`[DEBUG] Fatal error in server:`, e);
    console.error(e);
    process.exitCode = 1;
})