import * as zmq from "zeromq";
import dotenv from "dotenv";
import { EnvVar, getEnvVar, isDev } from "./app";

if (isDev()) {
    dotenv.config({ quiet: true, debug: false });
}

import { ReplyError, ReplyOk, Request } from "./server.types";
import { SMILEY } from "./emoji";
import { isCascadefundPaymentReq, cascadeFundRep } from "./cascadefund-payment";
import { isAraAllStarsReq, araAllStarsRep } from "./ara-all-stars";


async function run() {
    const sock = new zmq.Reply();

    await sock.bind(`tcp://0.0.0.0:${getEnvVar(EnvVar.PORT)}`);
    console.log(`${SMILEY} Payment gateway server is running on port 0.0.0.0:${getEnvVar(EnvVar.PORT)}`);

    for await (const [msg] of sock) {
        let request: Request;
        try {
            request = JSON.parse(msg.toString()) as Request;
        } catch (e: any) {
            console.error(`${SMILEY} Error parsing request: ${e.toString()}`);
            const reply: ReplyError = {
                error: e.toString(),
                time: Date.now(),
            }
            await sock.send(JSON.stringify(reply));
            continue;
        }

        if (request.cmd === "hello") {
            console.log(`${SMILEY} Hello, how are you doing?`);
            const reply: ReplyOk = {
                time: Date.now(),
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (isCascadefundPaymentReq(request.cmd)) {
            const reply = await cascadeFundRep(request);
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (isAraAllStarsReq(request.cmd)) {
            const reply = await araAllStarsRep(request);
            await sock.send(JSON.stringify(reply));
            continue;
        } else {
            const reply: ReplyError = {
                error: `unsupported command`,
                time: Date.now(),
            }
            await sock.send(JSON.stringify(reply));
            continue;
        }
    }
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})