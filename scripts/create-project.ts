import "dotenv/config";
import { OpensourceUsers, EMPTY_ADDRESS } from "../src/blockchain";
import { ReplyProjectCreation, type RequestProjectCreation } from "../src/server.types";
import { send } from "./client";
import { getPurls } from "./pkg";

async function run() {
    const users: OpensourceUsers = {
        business: {
            purl: "pkg:git@github.com/ara-foundation/cascade-blockchain-gateway.git",
            username: "ahmetson",
            authProvider: "github.com",
            withdraw: EMPTY_ADDRESS
        },
        envs: ["env:nodejs"],
        deps: getPurls(),
    }

    const json: RequestProjectCreation = {
        cmd: "createProject",
        params: users
    }

    const reply = await send(json) as ReplyProjectCreation;
    console.log(`Created project id: ${reply.params.projectID}, txid: ${reply.params.txHash}`)
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})