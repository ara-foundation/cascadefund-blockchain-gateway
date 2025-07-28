import "dotenv/config";
import { ReplyWithdrawerInfo, RequestWithdrawerInfo } from "../src/server.types";
import { send } from "./client";
import { SMILEY } from "../src/emoji";

async function run() {
    const specID = 1;
    const projectID = 2;

    const json: RequestWithdrawerInfo = {
        cmd: "withdrawerInfo",
        params: {specID, projectID}
    }

    console.log(`Return withdrawer and his balance info in ${projectID} project following ${specID} specification...`);
    const reply = await send(json) as ReplyWithdrawerInfo;
    console.log(`${SMILEY} Withdrawer ${reply.params.withdrawer} has ${reply.params.amount} of ${reply.params.resourceToken} tokens`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})