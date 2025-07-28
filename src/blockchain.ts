import { 
    AbiCoder, 
    Contract, 
    ContractTransactionResponse, 
    ethers, 
    formatEther, 
    JsonRpcProvider, 
    Wallet 
} from "ethers";
import { ABI_NAME, abis, EnvVar, getEnvVar } from "./app";
import { cwd } from "process";
import path from "path";
import fs from "fs";
import { SAD } from "./emoji";

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

type OpensourceUsers = {
    deps: string[];
    envs: string[];
    business: CategoryBusiness;
}

type PackageJSON = {
  name: string;
  devDependencies?: {
    [key: string]: string
  },
  dependencies?: {
    [key: string]: string
  },
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

type InitialDepositPayload = {
    counter: number; // such as Date.now()
    amount: bigint; // In ether's wei
    resourceToken: string;
    resourceName: string;
}

type Withdraw = {
    withdrawer: string;
    amount: bigint;
    resourceToken: string;
}

const networkUrl = getEnvVar(EnvVar.NETWORK_URL);
const serverPrivateKey = getEnvVar(EnvVar.SERVER_PRIVATE_KEY);
const provider = new JsonRpcProvider(networkUrl);
const signer = new Wallet(serverPrivateKey, provider);

export const serverAddress = signer.address;

const hyperpaymentContract = new Contract(getEnvVar(EnvVar.HYPERPAYMENT_ADDRESS), abis[ABI_NAME.HYPERPAYMENT], signer);
const hyperpaymentInterface = new ethers.Interface(abis[ABI_NAME.HYPERPAYMENT])
const customerContract = new Contract(getEnvVar(EnvVar.CUSTOMER_ADDRESS), abis[ABI_NAME.CUSTOMER], signer);
const stablecoinContract = new Contract(getEnvVar(EnvVar.STABLECOIN_ADDRESS), abis[ABI_NAME.STABLECOIN], signer);
const businessContract = new Contract(getEnvVar(EnvVar.BUSINESS_ADDRESS), abis[ABI_NAME.BUSINESS], signer);
const cascadeContract = new Contract(getEnvVar(EnvVar.CASCADE_ADDRESS), abis[ABI_NAME.CASCADE], signer);

export async function blockchainGreeting() {
    const balance = formatEther(await provider.getBalance(signer.address));
    const network = await provider.getNetwork();
    console.log(`I connect to ${network.name} (chainId=${network.chainId}) network.`)
    console.log(`I have ${balance} native tokens`);
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

export function getFirstPurl(): string|undefined {
    const purls = getPurls();
    if (purls.length === 0) {
        return undefined;
    }
    return purls[0];
}

function getPurls(): string[] {
    const url = path.join(cwd(), './package.json');
    const packageJSON = JSON.parse(fs.readFileSync(url, { encoding: 'utf-8' })) as PackageJSON;
    let deps: string[] = [];
    if (packageJSON.dependencies) {
        deps = Object.keys(packageJSON.dependencies).map(dep => `pkg:npm/${dep}@latest`);
    }
    if (packageJSON.devDependencies) {
        const devDeps = Object.keys(packageJSON.devDependencies).map(dep => `pkg:npm/${dep}@latest`);
        deps = deps.concat(...devDeps);
    }
    return deps;
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

export async function createSampleOpensourceProject(): Promise<CreateProject> {
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

    return await createOpensourceProject(users);
}

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

export async function calculateSampleAddress(specID: number, projectID: number, counter: number, amount: bigint): Promise<InitialDeposit> {
    const params: InitialDepositPayload = {
        counter: counter,
        amount: amount,
        resourceToken: getEnvVar(EnvVar.STABLECOIN_ADDRESS),
        resourceName: "customer",
    }

    return await calculateAddress(specID, projectID, params);
}

export async function calculateAddress(specID: number, projectID: number, params: InitialDepositPayload): Promise<InitialDeposit> {
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

    const calculatedAddress = await customerContract["getCalculatedAddress"](specID, projectID, encodedPayload);
    return {
        payload: encodedPayload,
        depositAddress: calculatedAddress as unknown as string,
    } as InitialDeposit;
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

export async function getWithdrawInfo(specID: number, projectID: number): Promise<Withdraw> {
    const project = await businessContract["projects"](specID, projectID);
    return {
        resourceToken: project[0],
        amount: project[1],
        withdrawer: project[2]
    }
}

export async function withdraw(specID: number, projectID: number, amount: bigint): Promise<string> {
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

    if (amount > info.amount) {
        throw `User has -${formatEther(amount-info.amount)} coins than asked for withdraw. Please pass correct argument to this function`;
    }

    const tx: ContractTransactionResponse = await businessContract["withdraw"](specID, projectID, amount);

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
export async function getCascadeWithdrawer(purl: string): Promise<Omit<Withdraw, "resourceToken">> {
    const cascadeAccount = await cascadeContract["cascadeAccounts"](purl);
    const balance = await cascadeContract["balanceOf"](purl, getEnvVar(EnvVar.STABLECOIN_ADDRESS));
    return {
        amount: balance,
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
    const token = getEnvVar(EnvVar.STABLECOIN_ADDRESS);
    const tx: ContractTransactionResponse = await cascadeContract["withdrawAllToken"](purl, token);

    console.log(`Blockchain: withdrawing all tokens, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: withdrawing confirmed ${tx.hash}`);
    return tx.hash;
}