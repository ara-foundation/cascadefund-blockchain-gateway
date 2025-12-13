import * as zmq from "zeromq"
import "dotenv/config";
import { EnvVar, getEnvVar } from "../src/app"
import { type Reply, type Request } from "../src/server.types";

const sock = new zmq.Request({
    receiveTimeout: 30000, // 30 second timeout
})

const host = getEnvVar(EnvVar.HOST);
const port = getEnvVar(EnvVar.PORT);
sock.connect(`tcp://${host}:${port}`)
console.log(`::: ZeroMQ Client connecting to ${host}:${port}`)

export async function send(req: Request): Promise<Reply> {
    try {
        await sock.send(JSON.stringify(req));
        const [result] = await sock.receive()
        return JSON.parse(result.toString()) as Reply;
    } catch (error) {
        console.error(`::: ZeroMQ Client error:`, error);
        throw new Error(`Failed to communicate with payment gateway server at ${host}:${port}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
