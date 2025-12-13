import "dotenv/config";
import { InitialDepositParams, signer } from "../src/blockchain";
import { ReplyDepositInitiation, RequestDepositInitiation } from "../src/server.types";
import { send } from "./client";
import { Contract, ContractTransactionResponse, parseEther } from "ethers";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"
import { EnvVar, getEnvVar, sleep } from "../src/app";

const networkID = getEnvVar(EnvVar.NETWORK_ID) as keyof typeof deployedContracts;
const stablecoinContract = new Contract(deployedContracts[networkID]["Stablecoin"].address, deployedContracts[networkID]["Stablecoin"].abi, signer);

const specID = 1;
const projectID = 2;
const rawAmount = "50";

export async function imitate50Deposit(counter: number = Date.now(), amount: bigint = parseEther(rawAmount)) {
    const params: InitialDepositParams = {
        counter: counter,
        amount: amount.toString(),
        resourceToken: deployedContracts[networkID]["Stablecoin"].address,
        resourceName: "customer",
    }

    const json: RequestDepositInitiation = {
        cmd: "initiateDeposit",
        params: { ...params, specID, projectID }
    }

    const reply = await send(json) as ReplyDepositInitiation;

    const txHash = await imitateDeposit(amount, reply.params.depositAddress);

    let checkCounter = 1;
    do {
        const deposited = await isInitialFundDeposited(amount, reply.params.depositAddress);
        if (deposited) {
            break;
        }
        checkCounter++;
        await sleep(500);
    } while (true)

    return {
        counter,
        amount,
        depositAddress: reply.params.depositAddress,
        txHash,
    }
}

async function isInitialFundDeposited(amount: bigint, depositAddress: string): Promise<boolean> {
    const balance: bigint | undefined = await stablecoinContract["balanceOf"](depositAddress);
    return balance! === amount;
}

/**
 * @param amount in wei
 * @param depositAddress deposit address
 * @returns transaction id
 */
async function imitateDeposit(amount: bigint, depositAddress: string): Promise<string> {
    const tx: ContractTransactionResponse = await stablecoinContract["transfer"](depositAddress, amount);
    await tx.wait();
    return tx.hash;
}
