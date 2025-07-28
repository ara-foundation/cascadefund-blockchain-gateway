import "dotenv/config";
import { ReplyTx, RequestCascadeWithdraw } from "../src/server.types";
import { send } from "./client";
import { SMILEY } from "../src/emoji";
import { getFirstPurl } from "./pkg";

async function run() {
    const purl = getFirstPurl()!;
    const json: RequestCascadeWithdraw = {
        cmd: "cascadeWithdraw",
        params: {purl}
    }

    console.log(`Cascade Withdraw for ${purl} package...`);
    const reply = await send(json) as ReplyTx;
    console.log(`${SMILEY} Withdrawing tx confirmed: ${reply.params.tx}`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})