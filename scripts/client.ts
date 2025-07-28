import * as zmq from "zeromq"
import "dotenv/config";
import { EnvVar, getEnvVar } from "../src/app"
import { type Reply, type Request } from "../src/server.types";

export async function send(req: Request): Promise<Reply> {
    const sock = new zmq.Request()

    sock.connect(`tcp://127.0.0.1:${getEnvVar(EnvVar.PORT)}`)
    console.log("Producer bound to port 3000")

    console.log(`Sending...`);
    await sock.send(JSON.stringify(req));
    const [result] = await sock.receive()

    return JSON.parse(result.toString()) as Reply;
}
