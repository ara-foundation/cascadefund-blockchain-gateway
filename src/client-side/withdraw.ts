import "dotenv/config";
import { parseEther } from "ethers";
import { SMILEY } from "../emoji";
import { ReplyTx, RequestWithdraw } from "../types";
import { send } from "./client";

async function run() {
    const specID = 1;
    const projectID = 2;
    const amount = parseEther("0.1");

    const json: RequestWithdraw = {
        cmd: "withdraw",
        params: { specID, projectID, amount: amount.toString(), all: false }
    }

    console.log(`Withdraw ${amount} of tokens for ${projectID} project following ${specID} specification...`);
    const reply = await send(json) as ReplyTx;
    console.log(`${SMILEY} Withdrawing tx confirmed: ${reply.params.tx}`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})