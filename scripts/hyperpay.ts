import "dotenv/config";
import { InitialDepositParams } from "../src/blockchain";
import { ReplyTx, RequestHyperpay } from "../src/server.types";
import { send } from "./client";
import { parseEther } from "ethers";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"
import { EnvVar, getEnvVar } from "../src/app";
import { SMILEY } from "../src/emoji";

const networkID = getEnvVar(EnvVar.NETWORK_ID) as keyof typeof deployedContracts;

async function run() {
    const specID = 1;
    const projectID = 2;
    const rawAmount = "1.5";
    const counter = 1753694965791;
    const amount = parseEther(rawAmount);
    
    const params: InitialDepositParams = {
        counter: counter,
        amount: amount.toString(),
        resourceToken: deployedContracts[networkID]["Stablecoin"].address,
        resourceName: "customer",
    }

    const json: RequestHyperpay = {
        cmd: "hyperpay",
        params: {...params, specID, projectID}
    }

    console.log(`Hyperpay by nonce '${counter}' to receive ${rawAmount} tokens...`);
    const reply = await send(json) as ReplyTx;
    console.log(`${SMILEY} Hyperpayment tx confirmed: ${reply.params.tx}`);
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})