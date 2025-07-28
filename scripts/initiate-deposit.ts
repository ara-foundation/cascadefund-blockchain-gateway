import "dotenv/config";
import { InitialDepositParams, signer } from "../src/blockchain";
import { ReplyDepositInitiation, RequestDepositInitiation } from "../src/server.types";
import { send } from "./client";
import { Contract, ContractTransactionResponse, parseEther } from "ethers";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"
import { EnvVar, getEnvVar, sleep } from "../src/app";
import { SMILEY } from "../src/emoji";

const networkID = getEnvVar(EnvVar.NETWORK_ID) as keyof typeof deployedContracts;
const stablecoinContract = new Contract(deployedContracts[networkID]["Stablecoin"].address, deployedContracts[networkID]["Stablecoin"].abi, signer);

async function run() {
    const specID = 1;
    const projectID = 2;
    const rawAmount = "1.5";
    const counter = Date.now();
    const amount = parseEther(rawAmount);
    
    const params: InitialDepositParams = {
        counter: counter,
        amount: amount.toString(),
        resourceToken: deployedContracts[networkID]["Stablecoin"].address,
        resourceName: "customer",
    }

    const json: RequestDepositInitiation = {
        cmd: "initiateDeposit",
        params: {...params, specID, projectID}
    }

    console.log(`Initiate a deposit by nonce '${counter}' to receive ${rawAmount} tokens...`);
    const reply = await send(json) as ReplyDepositInitiation;
    console.log(`Deposit address: ${reply.params.depositAddress}`);

    await imitateDeposit(amount, reply.params.depositAddress);
    
    let checkCounter = 1;
    do {
        const deposited = await isInitialFundDeposited(amount, reply.params.depositAddress);
        console.log(`Hyperpayment: check deposited tokens arrived? ${deposited}`)
        if (deposited) {
            break;
        }
        checkCounter++;
        await sleep(500);
    } while(true)

    console.log(`${SMILEY} Succeed, pass the following parameters to the ./hyperpay.ts ${counter} counter and ${rawAmount} raw amount then call it`)
}

/**
 * @param amount in wei
 * @param depositAddress deposit address
 * @returns transaction id
 */
export async function imitateDeposit(amount: bigint, depositAddress: string): Promise<string> {
    const tx: ContractTransactionResponse = await stablecoinContract["transfer"](depositAddress, amount);
    console.log(`Blockchain: imitating a customer deposit, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: customer deposit transaction was confirmed ${tx.hash}`);
    return tx.hash;
}

export async function isInitialFundDeposited(amount: bigint, depositAddress: string): Promise<boolean> {
    const balance: bigint|undefined = await stablecoinContract["balanceOf"](depositAddress);
    console.log(`Blockchain: The ${depositAddress} one time deposit has ${balance} stable coins. Matches: ${balance!>=amount}`)
    return balance! === amount;
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})