import "dotenv/config";
import { ReplyCascadeInfo, RequestCascadeInfo } from "../src/server.types";
import { send } from "./client";
import { SMILEY } from "../src/emoji";
import { getFirstPurl } from "./pkg";

async function run() {
    const purl = getFirstPurl();

    const json: RequestCascadeInfo = {
        cmd: "cascadeInfo",
        params: {purl: purl!}
    }

    console.log(`Cascade info for ${purl} package...`);
    const reply = await send(json) as ReplyCascadeInfo;
    console.log(`${SMILEY} The ${purl} has ${reply.params.amount} of tokens that ${reply.params.withdrawer} can withdraw`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})