import "dotenv/config";
import { ReplyTx, RequestWithdraw } from "../src/server.types";
import { send } from "./client";
import { SMILEY } from "../src/emoji";
import { parseEther } from "ethers";

async function run() {
    const specID = 1;
    const projectID = 2;
    const amount = parseEther("0.1");

    const json: RequestWithdraw = {
        cmd: "withdraw",
        params: {specID, projectID, amount: amount.toString(), all: false}
    }

    console.log(`Withdraw ${amount} of tokens for ${projectID} project following ${specID} specification...`);
    const reply = await send(json) as ReplyTx;
    console.log(`${SMILEY} Withdrawing tx confirmed: ${reply.params.tx}`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})