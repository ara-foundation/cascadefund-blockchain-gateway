import * as zmq from "zeromq";
import dotenv from "dotenv";
import { EnvVar, getEnvVar, isDev } from "../app";

if (isDev()) {
    dotenv.config({ quiet: true, debug: false });
}

import { ReplyError, ReplyOk, Request } from "../types";
import { SMILEY } from "./emoji";
import { isCascadefundPaymentReq, cascadeFundRep } from "./cascadefund-payment";
import { isAraAllStarsReq, araAllStarsRep } from "./ara-all-stars";


async function run() {
    const sock = new zmq.Reply();

    await sock.bind(`tcp://0.0.0.0:${getEnvVar(EnvVar.PORT)}`);
    console.log(`${SMILEY} Blockchain Gateway runs on port 0.0.0.0:${getEnvVar(EnvVar.PORT)}`);

    for await (const [msg] of sock) {
        let request: Request;
        try {
            const msgStr = msg.toString();
            request = JSON.parse(msgStr) as Request;
        } catch (e: any) {
            const reply: ReplyError = {
                error: e.toString(),
                time: Date.now(),
            }
            await sock.send(JSON.stringify(reply));
            continue;
        }

        if (request.cmd === "hello") {
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