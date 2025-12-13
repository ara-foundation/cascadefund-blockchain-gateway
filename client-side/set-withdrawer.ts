import "dotenv/config";
import { ReplyTx, RequestSetWithdrawer } from "../src/server.types";
import { send } from "./client";
import { SMILEY } from "../src/emoji";

async function run() {
    const specID = 1;
    const projectID = 2;
    const withdrawer = "0x6c3BD0855058F143Cf48662cA5318A71b8595faB";

    const json: RequestSetWithdrawer = {
        cmd: "setWithdrawer",
        params: {specID, projectID, withdrawer}
    }

    console.log(`Set withdrawer of ${projectID} project in ${specID} specification...`);
    const reply = await send(json) as ReplyTx;
    console.log(`${SMILEY} Withdrawer setting tx confirmed: ${reply.params.tx}`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})