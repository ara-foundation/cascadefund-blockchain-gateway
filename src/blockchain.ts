import { 
    AbiCoder, 
    Contract, 
    ContractTransactionResponse, 
    ethers, 
    formatEther, 
    JsonRpcProvider, 
    Wallet 
} from "ethers";
import { EnvVar, getEnvVar } from "./app";
import { SAD } from "./emoji";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"

type CategoryName = string;

export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

type CategoryBusiness = {
    purl: string; //"pkg:git@github.com/ara-foundation/cascade-blockchain-gateway.git"
    username: string; //"ahmetson";
    authProvider: string; // "github.com";
    withdraw: string;
}

type User = {
  category: CategoryName;
  payload: string;
}

export type OpensourceUsers = {
    deps: string[];
    envs: string[];
    business: CategoryBusiness;
}

export type CreateProject = {
    txHash: string;
    specID: number;
    projectID: number;
}

export type InitialDeposit = {
    payload: string;
    depositAddress: string;
}

export type InitialDepositParams = {
    counter: number; // such as Date.now()
    amount: string; // In wei format
    resourceToken: string;
    resourceName: string;
}

export type WithdrawerInfo = {
    withdrawer: string;
    amount: string;
    resourceToken: string;
}

const networkID = getEnvVar(EnvVar.NETWORK_ID) as keyof typeof deployedContracts;
const networkUrl = getEnvVar(EnvVar.NETWORK_URL);
const serverPrivateKey = getEnvVar(EnvVar.SERVER_PRIVATE_KEY);
const provider = new JsonRpcProvider(networkUrl);
export const signer = new Wallet(serverPrivateKey, provider);

export const serverAddress = signer.address;

const hyperpaymentContract = new Contract(deployedContracts[networkID]["HyperpaymentV1"].address, deployedContracts[networkID]["HyperpaymentV1"].abi, signer);
const hyperpaymentInterface = new ethers.Interface(deployedContracts[networkID]["HyperpaymentV1"].abi)
const customerContract = new Contract(deployedContracts[networkID]["CategoryCustomer"].address, deployedContracts[networkID]["CategoryCustomer"].abi, signer);
const businessContract = new Contract(deployedContracts[networkID]["CategoryBusiness"].address, deployedContracts[networkID]["CategoryBusiness"].abi, signer);
const cascadeContract = new Contract(deployedContracts[networkID]["CascadeAccount"].address, deployedContracts[networkID]["CascadeAccount"].abi, signer);

export async function blockchainGreeting() {
    const balance = formatEther(await provider.getBalance(signer.address));
    const network = await provider.getNetwork();
    console.log(`I'm connecting to ${network.name} (chainId=${network.chainId}) network.`)
    console.log(`In that network, I have ${balance} native tokens`);
}

/**
 * Hyperpayment functions
 */
export async function getLatestSpecId(): Promise<number> {
    const latestSpecID: bigint = await hyperpaymentContract["specCounter"]();
    return parseInt(latestSpecID.toString());
}

export function getOpensourceSpecId(): number {
    const value = getEnvVar(EnvVar.OPENSOURCE_HYPERPAYMENT_SPEC_ID);
    return parseInt(value);
}

function getBusinessPayload(business: CategoryBusiness): string {
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["string","string","string","address"], [business.purl, business.username, business.authProvider, business.withdraw]);
    return encodedPayload;
}

function getEnvPayload(envs: string[]): string {
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["uint","string[]"], [envs.length, envs]);
    return encodedPayload;
}

function getDepPayload(purls: string[]): string {
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["uint","string[]"], [purls.length, purls]);
    return encodedPayload;
}


/**********************************************************
 * 
 * Project ID
 * 
 *********************************************************/

/**
 * Returns the amount of projects in the project.
 * @param specID Hyperpayment specification ID
 * @returns 
 */
export async function getProjectCounter(specID: number): Promise<number> {
    const latestProjectID: bigint = await hyperpaymentContract["projectCounter"](specID);
    return parseInt(latestProjectID.toString());
}

/**********************************************************
 * 
 * Project Creation
 * 
 *********************************************************/

export async function createOpensourceProject(users: OpensourceUsers): Promise<CreateProject> {
    const hashedUsers: User[] = [
      { category: "business", payload: getBusinessPayload(users.business) },
      { category: "environment", payload: getEnvPayload(users.envs) },
      { category: "dep", payload: getDepPayload(users.deps) }  
    ]

    return await createProject(getOpensourceSpecId(), hashedUsers);
}

async function createProject(specID: number, users: User[]): Promise<CreateProject> {
    const userCategories = users.map(user => user.category);
    const userPayloads = users.map(user => user.payload);
    const tx: ContractTransactionResponse = await hyperpaymentContract["createProject"](specID, userCategories, userPayloads);
    console.log(`Blockchain: create project transaction submitted, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: project creation transaction was confirmed ${tx.hash}`);
    const projectCreated: CreateProject = {
        txHash: tx.hash,
        specID: specID,
        projectID: 0,
    }

    const receipt = await provider.getTransactionReceipt(tx.hash);
    receipt?.logs.forEach((log) => {
        try {
            const parsedLog = hyperpaymentInterface.parseLog(log);
            if (parsedLog?.name === "CreateProject") {
                projectCreated.projectID = parseInt(parsedLog.args[1].toString())
            }
        } catch (error) {
            console.error(`${SAD} Failed to decode the events`)
        }
    });

    return projectCreated;
}

/**********************************************************
 * 
 * Initiate the deposit
 * 
 *********************************************************/

export function initialDepositPayload(params: InitialDepositParams): string {
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(
        [
            "uint",
            "uint",
            "address",
            "string"
        ], [
            params.counter, 
            params.amount, 
            params.resourceToken, 
            params.resourceName
        ]
    );
    return encodedPayload;
}

export async function calculateAddress(specID: number, projectID: number, encodedPayload: string): Promise<string> {
    const calculatedAddress = await customerContract["getCalculatedAddress"](specID, projectID, encodedPayload);
    return calculatedAddress as unknown as string;
}

/**********************************************************
 * 
 * Hyperpayment
 * 
 *********************************************************/

export async function hyperpay(specID: number, projectID: number, payload: string): Promise<string> {
    const tx: ContractTransactionResponse = await hyperpaymentContract["hyperpay"](specID, projectID, payload);
    console.log(`Blockchain: hyperpay, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: hyperpayment was confirmed ${tx.hash}`);
    return tx.hash;
}

/**********************************************************
 * 
 * Business
 * - get withdrawer
 * - getBalance
 * - withdraw
 * - withdrawAll
 * - setWithdrawer
 * 
 *********************************************************/

export async function getWithdrawInfo(specID: number, projectID: number): Promise<WithdrawerInfo> {
    const project = await businessContract["projects"](specID, projectID);
    return {
        resourceToken: project[0],
        amount: project[1].toString(),
        withdrawer: project[2]
    }
}

export async function withdraw(specID: number, projectID: number, amount: string): Promise<string> {
    const info = await getWithdrawInfo(specID, projectID);
    if (info.withdrawer === EMPTY_ADDRESS) {    
        throw `server has no withdraw token, checking can server withdraw on behalf of the user?`;
    }
        
    const withdrawRole = "0xa8a7bc421f721cb936ea99efdad79237e6ee0b871a2a08cf648691f9584cdc77";
    const serverCanWithdraw: boolean = await businessContract["hasRole"](withdrawRole, serverAddress);
    if (!serverCanWithdraw) {
        throw `Server has no withdraw role, it can not withdraw tokens on behalf of the user. Consider using cascade withdrawer`;
    } else {
        console.log(`Server has withdraw role`)
    }

    if (BigInt(amount) > BigInt(info.amount)) {
        throw `User has -${formatEther(BigInt(amount)-BigInt(info.amount))} coins than asked for withdraw. Please pass correct argument to this function`;
    }

    const tx: ContractTransactionResponse = await businessContract["withdraw"](specID, projectID, amount);

    console.log(`Blockchain: withdrawing a token, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: withdrawing was confirmed ${tx.hash}`);
    return tx.hash;
}

export async function withdrawAll(specID: number, projectID: number): Promise<string> {
    const info = await getWithdrawInfo(specID, projectID);
    if (info.withdrawer === EMPTY_ADDRESS) {    
        throw `server has no withdraw token, checking can server withdraw on behalf of the user?`;
    }
        
    const withdrawRole = "0xa8a7bc421f721cb936ea99efdad79237e6ee0b871a2a08cf648691f9584cdc77";
    const serverCanWithdraw: boolean = await businessContract["hasRole"](withdrawRole, serverAddress);
    if (!serverCanWithdraw) {
        throw `Server has no withdraw role, it can not withdraw tokens on behalf of the user. Consider using cascade withdrawer`;
    } else {
        console.log(`Server has withdraw role`)
    }

    if (BigInt(info.amount) <= 0) {
        throw `User has no coins for withdraw. Please pass correct argument to this function`;
    }

    const tx: ContractTransactionResponse = await businessContract["withdrawAll"](specID, projectID);

    console.log(`Blockchain: withdrawing a token, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: withdrawing was confirmed ${tx.hash}`);
    return tx.hash;
}

export async function setWithdrawer(specID: number, projectID: number, withdrawer: string): Promise<string> {
    const tx: ContractTransactionResponse = await businessContract["setWithdrawer"](specID, projectID, withdrawer);

    console.log(`Blockchain: set a withdrawer, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: withdrawer setting confirmed ${tx.hash}`);
    return tx.hash;
}

/**********************************************************
 * 
 * SBOM
 * - withdraw
 * - set withdrawer
 * 
 *********************************************************/
export async function getCascadeWithdrawer(purl: string): Promise<Omit<WithdrawerInfo, "resourceToken">> {
    const cascadeAccount = await cascadeContract["cascadeAccounts"](purl);
    const balance = await cascadeContract["balanceOf"](purl, deployedContracts[networkID]["Stablecoin"].address);
    return {
        amount: balance.toString(),
        withdrawer: cascadeAccount[5],
    }
}

export async function setCascadeMaintainer(purl: string, addr: string, _username: string, _authProvider: string): Promise<string> {
    const tx: ContractTransactionResponse = await cascadeContract["setMaintainer"](purl, addr, _username, _authProvider);

    console.log(`Blockchain: set cascade maintainer, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: cascade maintainer setting confirmed ${tx.hash}`);
    return tx.hash;
}

export async function cascadeWithdraw(purl: string): Promise<string> {
    const token = deployedContracts[networkID]["Stablecoin"].address;
    const tx: ContractTransactionResponse = await cascadeContract["withdrawAllToken"](purl, token);

    console.log(`Blockchain: withdrawing all tokens, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: withdrawing confirmed ${tx.hash}`);
    return tx.hash;
}