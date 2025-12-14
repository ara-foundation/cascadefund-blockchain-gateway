import * as zmq from "zeromq"
import "dotenv/config";
import { EnvVar, getEnvVar } from "../server-side/app"
import { type Reply, type Request } from "../server-side/server.types";

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
        console.error(`::: ZeroMQ Client error:`, error);
        reject(new Error(`Failed to communicate with payment gateway server at ${host}:${port}: ${error instanceof Error ? error.message : String(error)}`));
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
