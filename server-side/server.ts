import * as zmq from "zeromq";
import dotenv from "dotenv";
import { EnvVar, getEnvVar, isDev } from "./app";

if (isDev()) {
    dotenv.config({ quiet: true, debug: false });
}

import { ReplyCascadeInfo, ReplyDepositInitiation, ReplyError, ReplyOk, ReplyProjectCreation, ReplyTx, ReplyWithdrawerInfo, Request } from "./server.types";
import { SMILEY } from "./emoji";
import { calculateAddress, cascadeWithdraw, createOpensourceProject, getCascadeWithdrawer, getWithdrawInfo, hyperpay, initialDepositPayload, setCascadeMaintainer, setWithdrawer, withdraw, withdrawAll } from "./blockchain";


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
        } else if (request.cmd === "createProject") {
            const createdProject = await createOpensourceProject(request.params);
            const reply: ReplyProjectCreation = {
                time: Date.now(),
                params: createdProject
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "initiateDeposit") {
            const encodedPayload = initialDepositPayload(request.params);
            const calculatedAddress = await calculateAddress(request.params.specID, request.params.projectID, encodedPayload);
            const reply: ReplyDepositInitiation = {
                time: Date.now(),
                params: {
                    depositAddress: calculatedAddress,
                    payload: encodedPayload,
                }
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "hyperpay") {
            const encodedPayload = initialDepositPayload(request.params);
            const tx = await hyperpay(request.params.specID, request.params.projectID, encodedPayload);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx: tx,
                }
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "setWithdrawer") {
            const tx = await setWithdrawer(request.params.specID, request.params.projectID, request.params.withdrawer);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx: tx,
                }
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "withdrawerInfo") {
            const info = await getWithdrawInfo(request.params.specID, request.params.projectID);
            const reply: ReplyWithdrawerInfo = {
                time: Date.now(),
                params: info
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "withdraw") {
            let tx: string;
            if (request.params.all) {
                tx = await withdrawAll(request.params.specID, request.params.projectID);
            } else {
                tx = await withdraw(request.params.specID, request.params.projectID, request.params.amount);
            }
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx
                }
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "cascadeInfo") {
            const cascadeInfo = await getCascadeWithdrawer(request.params.purl);
            const reply: ReplyCascadeInfo = {
                time: Date.now(),
                params: cascadeInfo
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "setCascadeWithdrawer") {
            const tx = await setCascadeMaintainer(request.params.purl, request.params.withdrawer, request.params.username, request.params.authProvider);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx
                }
            }
            await sock.send(JSON.stringify(reply));
            continue;
        } else if (request.cmd === "cascadeWithdraw") {
            const tx = await cascadeWithdraw(request.params.purl);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx
                }
            }
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

        const reply: ReplyOk = {
            time: Date.now(),
        }
        await sock.send(JSON.stringify(reply));
    }
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})