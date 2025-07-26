import { AbiCoder, Contract, ContractTransactionResponse, formatEther, hexlify, JsonRpcProvider, Wallet } from "ethers";
import { ABI_NAME, abis, EnvVar, getEnvVar } from "./app";
import { cwd } from "process";
import path from "path";
import fs from "fs";

type CategoryName = string;
type User = {
  category: CategoryName;
  payload: string;
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

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

const networkUrl = getEnvVar(EnvVar.NETWORK_URL);
const serverPrivateKey = getEnvVar(EnvVar.SERVER_PRIVATE_KEY);
const provider = new JsonRpcProvider(networkUrl);
const signer = new Wallet(serverPrivateKey, provider);

export const serverAddress = signer.address;

const hyperpaymentContract = new Contract(getEnvVar(EnvVar.HYPERPAYMENT_ADDRESS), abis[ABI_NAME.HYPERPAYMENT], signer);

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

function getBusinessPayload(): string {
    const purl = "pkg:git@github.com/ara-foundation/cascade-blockchain-gateway.git"
    const username = "ahmetson";
    const authProvider = "github.com";
    const withdraw = EMPTY_ADDRESS;
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["string","string","string","address"], [purl, username, authProvider, withdraw]);

    return encodedPayload;
}

function getEnvPayload(): string {
    const envs = ["env:nodejs"];
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["uint","string[]"], [envs.length, envs]);
    return encodedPayload;
}

function getDepPayload(): string {
    const purls = getPurls();
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["uint","string[]"], [purls.length, purls]);
    return encodedPayload;
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

export async function getProjectCounter(specID: number): Promise<number> {
    const latestProjectID: bigint = await hyperpaymentContract["projectCounter"](specID);
    return parseInt(latestProjectID.toString());
}

export async function createSampleProject(): Promise<string> {
    const users: User[] = [
      { category: "business", payload: getBusinessPayload() },
      { category: "environment", payload: getEnvPayload() },
      { category: "dep", payload: getDepPayload() }
    ];

    return await createProject(getOpensourceSpecId(), users);
}

export async function createProject(specID: number, users: User[]): Promise<string> {
    const userCategories = users.map(user => user.category);
    const userPayloads = users.map(user => user.payload);
    const tx: ContractTransactionResponse = await hyperpaymentContract["createProject"](specID, userCategories, userPayloads);
    console.log(`Blockchain: create project transaction submitted, tx = ${tx.hash}, confirming...`);
    await tx.wait();
    console.log(`Blockchain: project creation transaction was confirmed ${tx.hash}`);
    // const latestProjectId = await getProjectCounter(specID);
    // console.log(`Blockchain: the ${specID} specification has ${latestProjectId}`);
    return tx.hash;
}
