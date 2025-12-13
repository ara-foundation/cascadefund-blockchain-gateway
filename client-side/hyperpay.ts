import "dotenv/config";
import { InitialDepositParams } from "../src/blockchain";
import { ReplyTx, RequestHyperpay } from "../src/server.types";
import { send } from "./client";
import { parseEther } from "ethers";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"
import { EnvVar, getEnvVar } from "../src/app";

const networkID = getEnvVar(EnvVar.NETWORK_ID) as keyof typeof deployedContracts;

const specID = 1;
const projectID = 2;
const rawAmount = "50";

export async function hyperpay(counter: number = Date.now(), amount: bigint = parseEther(rawAmount)): Promise<string> {
    const params: InitialDepositParams = {
        counter: counter,
        amount: amount.toString(),
        resourceToken: deployedContracts[networkID]["Stablecoin"].address,
        resourceName: "customer",
    }

    const json: RequestHyperpay = {
        cmd: "hyperpay",
        params: { ...params, specID, projectID }
    }

    const reply = await send(json) as ReplyTx;
    return reply.params.tx;
}
