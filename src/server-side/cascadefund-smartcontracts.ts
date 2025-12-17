import {
    AbiCoder,
    Contract,
    ContractTransactionResponse,
    ethers,
    formatEther,
} from "ethers";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"
import { EnvVar, getEnvVar } from "../app";
import { SAD } from "../emoji";
import { type OpensourceUsers, type CreateProject, type InitialDepositParams, type WithdrawerInfo, type CategoryBusiness, type User, EMPTY_ADDRESS, networkID, provider, signer, serverAddress } from "../types";

console.log(`[DEBUG] Initializing cascadefund contracts for network ID: ${String(networkID)}`);
const hyperpaymentContract = new Contract(deployedContracts[networkID]["HyperpaymentV1"].address, deployedContracts[networkID]["HyperpaymentV1"].abi, signer);
console.log(`[DEBUG] HyperpaymentV1 contract created at: ${deployedContracts[networkID]["HyperpaymentV1"].address}`);
const hyperpaymentInterface = new ethers.Interface(deployedContracts[networkID]["HyperpaymentV1"].abi)
console.log(`[DEBUG] HyperpaymentV1 interface created`);
const customerContract = new Contract(deployedContracts[networkID]["CategoryCustomer"].address, deployedContracts[networkID]["CategoryCustomer"].abi, signer);
console.log(`[DEBUG] CategoryCustomer contract created at: ${deployedContracts[networkID]["CategoryCustomer"].address}`);
const businessContract = new Contract(deployedContracts[networkID]["CategoryBusiness"].address, deployedContracts[networkID]["CategoryBusiness"].abi, signer);
console.log(`[DEBUG] CategoryBusiness contract created at: ${deployedContracts[networkID]["CategoryBusiness"].address}`);
const cascadeContract = new Contract(deployedContracts[networkID]["CascadeAccount"].address, deployedContracts[networkID]["CascadeAccount"].abi, signer);
console.log(`[DEBUG] CascadeAccount contract created at: ${deployedContracts[networkID]["CascadeAccount"].address}`);

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
    console.log(`[DEBUG] getLatestSpecId called`);
    console.log(`[DEBUG] Calling hyperpaymentContract.specCounter()...`);
    const latestSpecID: bigint = await hyperpaymentContract["specCounter"]();
    const result = parseInt(latestSpecID.toString());
    console.log(`[DEBUG] getLatestSpecId completed, result: ${result}`);
    return result;
}

export function getOpensourceSpecId(): number {
    console.log(`[DEBUG] getOpensourceSpecId called`);
    const value = getEnvVar(EnvVar.OPENSOURCE_HYPERPAYMENT_SPEC_ID);
    const result = parseInt(value);
    console.log(`[DEBUG] getOpensourceSpecId completed, specID: ${result}`);
    return result;
}

function getBusinessPayload(business: CategoryBusiness): string {
    console.log(`[DEBUG] Encoding business payload:`, business);
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["string", "string", "string", "address"], [business.purl, business.username, business.authProvider, business.withdraw]);
    console.log(`[DEBUG] Encoded business payload: ${encodedPayload.substring(0, 100)}...`);
    return encodedPayload;
}

function getEnvPayload(envs: string[]): string {
    console.log(`[DEBUG] Encoding env payload, count: ${envs.length}`);
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["uint", "string[]"], [envs.length, envs]);
    console.log(`[DEBUG] Encoded env payload: ${encodedPayload.substring(0, 100)}...`);
    return encodedPayload;
}

function getDepPayload(purls: string[]): string {
    console.log(`[DEBUG] Encoding dep payload, count: ${purls.length}`);
    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["uint", "string[]"], [purls.length, purls]);
    console.log(`[DEBUG] Encoded dep payload: ${encodedPayload.substring(0, 100)}...`);
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
    console.log(`[DEBUG] getProjectCounter called with specID: ${specID}`);
    console.log(`[DEBUG] Calling hyperpaymentContract.projectCounter(${specID})...`);
    const latestProjectID: bigint = await hyperpaymentContract["projectCounter"](specID);
    const result = parseInt(latestProjectID.toString());
    console.log(`[DEBUG] getProjectCounter completed, result: ${result}`);
    return result;
}

/**********************************************************
 * 
 * Project Creation
 * 
 *********************************************************/

export async function createOpensourceProject(users: OpensourceUsers): Promise<CreateProject> {
    console.log(`[DEBUG] createOpensourceProject called with users:`, users);
    console.log(`[DEBUG] Processing business, envs (${users.envs.length}), deps (${users.deps.length})`);
    const hashedUsers: User[] = [
        { category: "business", payload: getBusinessPayload(users.business) },
        { category: "environment", payload: getEnvPayload(users.envs) },
        { category: "dep", payload: getDepPayload(users.deps) }
    ]
    console.log(`[DEBUG] Created ${hashedUsers.length} hashed user categories`);
    const specID = getOpensourceSpecId();
    console.log(`[DEBUG] Calling createProject with specID: ${specID}`);
    return await createProject(specID, hashedUsers);
}

async function createProject(specID: number, users: User[]): Promise<CreateProject> {
    console.log(`[DEBUG] createProject called with specID: ${specID}, users count: ${users.length}`);
    const userCategories = users.map(user => user.category);
    const userPayloads = users.map(user => user.payload);
    console.log(`[DEBUG] User categories:`, userCategories);
    console.log(`[DEBUG] Calling hyperpaymentContract.createProject(${specID}, [${userCategories.length} categories], [${userPayloads.length} payloads])...`);
    const tx: ContractTransactionResponse = await hyperpaymentContract["createProject"](specID, userCategories, userPayloads);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: create project transaction submitted, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
    console.log(`Blockchain: project creation transaction was confirmed ${tx.hash}`);
    const projectCreated: CreateProject = {
        txHash: tx.hash,
        specID: specID,
        projectID: 0,
    }

    console.log(`[DEBUG] Fetching transaction receipt to parse events...`);
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    let projectIDFound = false;
    txReceipt?.logs.forEach((log: any) => {
        try {
            const parsedLog = hyperpaymentInterface.parseLog(log);
            if (parsedLog?.name === "CreateProject") {
                projectCreated.projectID = parseInt(parsedLog.args[1].toString())
                projectIDFound = true;
                console.log(`[DEBUG] Found CreateProject event, projectID: ${projectCreated.projectID}`);
            }
        } catch (error) {
            console.error(`[DEBUG] Failed to decode log event:`, error);
        }
    });
    
    if (!projectIDFound) {
        console.warn(`[DEBUG] Warning: CreateProject event not found in transaction logs`);
    }
    
    console.log(`[DEBUG] createProject returning:`, projectCreated);
    return projectCreated;
}

/**********************************************************
 * 
 * Initiate the deposit
 * 
 *********************************************************/

export function initialDepositPayload(params: InitialDepositParams): string {
    console.log(`[DEBUG] initialDepositPayload called with params:`, params);
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
    console.log(`[DEBUG] Encoded deposit payload: ${encodedPayload.substring(0, 100)}...`);
    return encodedPayload;
}

export async function calculateAddress(specID: number, projectID: number, encodedPayload: string): Promise<string> {
    console.log(`[DEBUG] calculateAddress called with specID: ${specID}, projectID: ${projectID}`);
    console.log(`[DEBUG] Calling customerContract.getCalculatedAddress(${specID}, ${projectID}, ${encodedPayload.substring(0, 50)}...)...`);
    const calculatedAddress = await customerContract["getCalculatedAddress"](specID, projectID, encodedPayload);
    console.log(`[DEBUG] calculateAddress completed, address: ${calculatedAddress}`);
    return calculatedAddress as unknown as string;
}

/**********************************************************
 * 
 * Hyperpayment
 * 
 *********************************************************/

export async function hyperpay(specID: number, projectID: number, payload: string): Promise<string> {
    console.log(`[DEBUG] hyperpay called with specID: ${specID}, projectID: ${projectID}`);
    console.log(`[DEBUG] Payload: ${payload.substring(0, 100)}...`);
    console.log(`[DEBUG] Calling hyperpaymentContract.hyperpay(${specID}, ${projectID}, payload)...`);
    const tx: ContractTransactionResponse = await hyperpaymentContract["hyperpay"](specID, projectID, payload);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: hyperpay, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
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
    console.log(`[DEBUG] getWithdrawInfo called with specID: ${specID}, projectID: ${projectID}`);
    console.log(`[DEBUG] Calling businessContract.projects(${specID}, ${projectID})...`);
    const project = await businessContract["projects"](specID, projectID);
    console.log(`[DEBUG] Contract call returned, project data:`, project);
    const info = {
        resourceToken: project[0],
        amount: project[1].toString(),
        withdrawer: project[2]
    }
    console.log(`[DEBUG] getWithdrawInfo returning:`, info);
    return info;
}

export async function withdraw(specID: number, projectID: number, amount: string): Promise<string> {
    console.log(`[DEBUG] withdraw called with specID: ${specID}, projectID: ${projectID}, amount: ${amount}`);
    const info = await getWithdrawInfo(specID, projectID);
    console.log(`[DEBUG] Withdraw info retrieved:`, info);
    if (info.withdrawer === EMPTY_ADDRESS) {
        console.error(`[DEBUG] Error: withdrawer is empty address`);
        throw `server has no withdraw token, checking can server withdraw on behalf of the user?`;
    }

    const withdrawRole = "0xa8a7bc421f721cb936ea99efdad79237e6ee0b871a2a08cf648691f9584cdc77";
    console.log(`[DEBUG] Checking if server has withdraw role...`);
    const serverCanWithdraw: boolean = await businessContract["hasRole"](withdrawRole, serverAddress);
    if (!serverCanWithdraw) {
        console.error(`[DEBUG] Error: Server does not have withdraw role`);
        throw `Server has no withdraw role, it can not withdraw tokens on behalf of the user. Consider using cascade withdrawer`;
    } else {
        console.log(`[DEBUG] Server has withdraw role`);
    }

    console.log(`[DEBUG] Validating amount: requested ${amount}, available ${info.amount}`);
    if (BigInt(amount) > BigInt(info.amount)) {
        const deficit = formatEther(BigInt(amount) - BigInt(info.amount));
        console.error(`[DEBUG] Error: Insufficient balance. Deficit: ${deficit}`);
        throw `User has -${deficit} coins than asked for withdraw. Please pass correct argument to this function`;
    }

    console.log(`[DEBUG] Calling businessContract.withdraw(${specID}, ${projectID}, ${amount})...`);
    const tx: ContractTransactionResponse = await businessContract["withdraw"](specID, projectID, amount);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: withdrawing a token, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
    console.log(`Blockchain: withdrawing was confirmed ${tx.hash}`);
    return tx.hash;
}

export async function withdrawAll(specID: number, projectID: number): Promise<string> {
    console.log(`[DEBUG] withdrawAll called with specID: ${specID}, projectID: ${projectID}`);
    const info = await getWithdrawInfo(specID, projectID);
    console.log(`[DEBUG] Withdraw info retrieved:`, info);
    if (info.withdrawer === EMPTY_ADDRESS) {
        console.error(`[DEBUG] Error: withdrawer is empty address`);
        throw `server has no withdraw token, checking can server withdraw on behalf of the user?`;
    }

    const withdrawRole = "0xa8a7bc421f721cb936ea99efdad79237e6ee0b871a2a08cf648691f9584cdc77";
    console.log(`[DEBUG] Checking if server has withdraw role...`);
    const serverCanWithdraw: boolean = await businessContract["hasRole"](withdrawRole, serverAddress);
    if (!serverCanWithdraw) {
        console.error(`[DEBUG] Error: Server does not have withdraw role`);
        throw `Server has no withdraw role, it can not withdraw tokens on behalf of the user. Consider using cascade withdrawer`;
    } else {
        console.log(`[DEBUG] Server has withdraw role`);
    }

    console.log(`[DEBUG] Validating amount: available ${info.amount}`);
    if (BigInt(info.amount) <= 0) {
        console.error(`[DEBUG] Error: No coins available for withdraw`);
        throw `User has no coins for withdraw. Please pass correct argument to this function`;
    }

    console.log(`[DEBUG] Calling businessContract.withdrawAll(${specID}, ${projectID})...`);
    const tx: ContractTransactionResponse = await businessContract["withdrawAll"](specID, projectID);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: withdrawing a token, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
    console.log(`Blockchain: withdrawing was confirmed ${tx.hash}`);
    return tx.hash;
}

export async function setWithdrawer(specID: number, projectID: number, withdrawer: string): Promise<string> {
    console.log(`[DEBUG] setWithdrawer called with specID: ${specID}, projectID: ${projectID}, withdrawer: ${withdrawer}`);
    console.log(`[DEBUG] Calling businessContract.setWithdrawer(${specID}, ${projectID}, ${withdrawer})...`);
    const tx: ContractTransactionResponse = await businessContract["setWithdrawer"](specID, projectID, withdrawer);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: set a withdrawer, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
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
    console.log(`[DEBUG] getCascadeWithdrawer called with purl: ${purl}`);
    console.log(`[DEBUG] Calling cascadeContract.cascadeAccounts(${purl})...`);
    const cascadeAccount = await cascadeContract["cascadeAccounts"](purl);
    console.log(`[DEBUG] Cascade account retrieved:`, cascadeAccount);
    const stablecoinAddress = deployedContracts[networkID]["Stablecoin"].address;
    console.log(`[DEBUG] Calling cascadeContract.balanceOf(${purl}, ${stablecoinAddress})...`);
    const balance = await cascadeContract["balanceOf"](purl, stablecoinAddress);
    console.log(`[DEBUG] Balance retrieved: ${balance.toString()}`);
    const result = {
        amount: balance.toString(),
        withdrawer: cascadeAccount[5],
    }
    console.log(`[DEBUG] getCascadeWithdrawer returning:`, result);
    return result;
}

export async function setCascadeMaintainer(purl: string, addr: string, _username: string, _authProvider: string): Promise<string> {
    console.log(`[DEBUG] setCascadeMaintainer called with purl: ${purl}, addr: ${addr}, username: ${_username}, authProvider: ${_authProvider}`);
    console.log(`[DEBUG] Calling cascadeContract.setMaintainer(${purl}, ${addr}, ${_username}, ${_authProvider})...`);
    const tx: ContractTransactionResponse = await cascadeContract["setMaintainer"](purl, addr, _username, _authProvider);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: set cascade maintainer, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
    console.log(`Blockchain: cascade maintainer setting confirmed ${tx.hash}`);
    return tx.hash;
}

export async function cascadeWithdraw(purl: string): Promise<string> {
    console.log(`[DEBUG] cascadeWithdraw called with purl: ${purl}`);
    const token = deployedContracts[networkID]["Stablecoin"].address;
    console.log(`[DEBUG] Stablecoin address: ${token}`);
    console.log(`[DEBUG] Calling cascadeContract.withdrawAllToken(${purl}, ${token})...`);
    const tx: ContractTransactionResponse = await cascadeContract["withdrawAllToken"](purl, token);
    console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);
    console.log(`Blockchain: withdrawing all tokens, tx = ${tx.hash}, confirming...`);
    console.log(`[DEBUG] Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
    console.log(`Blockchain: withdrawing confirmed ${tx.hash}`);
    return tx.hash;
}