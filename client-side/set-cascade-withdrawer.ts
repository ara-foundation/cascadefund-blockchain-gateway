import "dotenv/config";
import { ReplyTx, RequestSetCascadeWithdrawer } from "../src/server.types";
import { send } from "./client";
import { SMILEY } from "../src/emoji";
import { getFirstPurl } from "./pkg";

async function run() {
    const purl = getFirstPurl()!;
    const withdrawer = "0x6c3BD0855058F143Cf48662cA5318A71b8595faB";

    const json: RequestSetCascadeWithdrawer = {
        cmd: "setCascadeWithdrawer",
        params: {withdrawer, purl, username: "ahmetson", authProvider: "github.com"}
    }

    console.log(`Set cascade maintainer for ${purl} project...`);
    const reply = await send(json) as ReplyTx;
    console.log(`${SMILEY} Withdrawer info setting tx confirmed: ${reply.params.tx}`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})