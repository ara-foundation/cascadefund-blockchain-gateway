import dotenv from "dotenv";
import { isDev, sleep } from "./app";

if (isDev()) {
    dotenv.config({quiet: true, debug: false});
}

import { SMILEY } from "./emoji";
import { blockchainGreeting, calculateSampleAddress, cascadeWithdraw, CreateProject, createSampleOpensourceProject, EMPTY_ADDRESS, getCascadeWithdrawer, getFirstPurl, getLatestSpecId, getOpensourceSpecId, getProjectCounter, getWithdrawInfo, hyperpay, imitateDeposit, InitialDeposit, isInitialFundDeposited, serverAddress, setCascadeMaintainer, setWithdrawer, withdraw } from "./blockchain";
import { formatEther, parseEther } from "ethers";


async function createProject(specID: number): Promise<CreateProject> {
    const latestSpecID = await getLatestSpecId();
    const latestOpensourceProjectId = await getProjectCounter(specID);
    console.log(`Hyperpayment: smartcontract has ${latestSpecID} specifications.`);
    console.log(`Hyperpayment: open-source specification id: ${specID}`);
    console.log(`Hyperpayment: open-source specification has ${latestOpensourceProjectId} projects`);

    console.log(`Hyperpayment: create sample open-source project (this project itself)`);
    const createdProject = await createSampleOpensourceProject();
    console.log(`Hyperpayment: created project ${createdProject.projectID}, tx: ${createdProject.txHash}`);
    return createdProject;
}

async function initiateCustomerDeposit(opensourceID: number, projectID: number): Promise<InitialDeposit> {
    console.log(`\nHyperpayment: project id to test ${projectID}`);
    const amount = parseEther("1.5");
    const counter = Date.now()
    console.log(`Hyperpayment: calculate address with the nonce ${counter} for ${amount} tokens`);
    const initialDeposit = await calculateSampleAddress(opensourceID, projectID, counter, amount);
    console.log(`Hyperpayment: deposit into ${initialDeposit.depositAddress}\nHyperpayment: initial payload `, initialDeposit.payload);
    await imitateDeposit(amount, initialDeposit.depositAddress);
    
    let checkCounter = 1;
    do {
        const deposited = await isInitialFundDeposited(amount, initialDeposit.depositAddress);
        console.log(`Hyperpayment: check deposited tokens arrived? ${deposited}`)
        if (deposited) {
            break;
        }
        checkCounter++;
        await sleep(500);
    } while(true)

    return initialDeposit;
}

/**
 * initialize the blockchain client.
 * load the smartcontract parameters.
 * create functions for each necessary call in cascade fund.
 * 
 */

async function main() {
    console.log(`Dev Mode=${isDev()}.\n${SMILEY} Hello, my name is: ${serverAddress}`);
    await blockchainGreeting()
    
    // create project
    const opensourceID = getOpensourceSpecId();
    const projectCreated = await createProject(opensourceID);
    console.log(`Hyperpayment: project ${projectCreated.projectID} was created.`);
    // const depositInfo = await initiateCustomerDeposit(opensourceID, projectCreated.projectID);
    // console.log(`Hyperpayment: initial deposit address: ${depositInfo.depositAddress}`);

    console.log(`\n\n`)
    // console.log(`Hyperpayment: initiate the hyperpay by a hook`);
    // await hyperpay(opensourceID, projectCreated.projectID, depositInfo.payload);
    // const projectID = 14;
    // const info = await getWithdrawInfo(opensourceID, projectID);
    // console.log(`Hyperpayment: the open source project ${projectID} withdrawer: ${info.withdrawer}`);
    // console.log(`Hyperpayment: business user has ${formatEther(info.amount)} of ${info.resourceToken} tokens`);

    // if (info.withdrawer === EMPTY_ADDRESS) {
    //     console.log(`Hyperpayment: project has no withdrawer, let's set it`);
    //     const withdrawer = "0x6c3BD0855058F143Cf48662cA5318A71b8595faB";
    //     const tx = await setWithdrawer(opensourceID, projectID, withdrawer);
    //     console.log(`Hyperpayment: withdrawer was set, use your wallet to withdraw: ${tx}`);
    // } else {
    //     console.log(`Hyperpayment: project ${projectID} has ${info.withdrawer}`);
    // }

    // const tx = await withdraw(opensourceID, projectID, parseEther("0.1"));
    // console.log(`Hyperpayment: withdrawn 0.1 ETH, tx: ${tx}`);

    // const purl = getFirstPurl();
    // console.log(`Hyperpayment: fetch info about ${purl}`);
    // const cascadeInfo = await getCascadeWithdrawer(purl!);
    // console.log(`The purl has ${formatEther(cascadeInfo.amount)}, withdrawer ${cascadeInfo.withdrawer}`);
    // if (cascadeInfo.withdrawer === EMPTY_ADDRESS) {
    //     console.log(`Hyperpayment: set the package maintainer...`);
    //     const withdrawer = "0x6c3BD0855058F143Cf48662cA5318A71b8595faB";
    //     const username = "dotenv";
    //     const authProvider = "github.com"
    //     const tx = await setCascadeMaintainer(purl!, withdrawer, username, authProvider);
    //     console.log(`Hyperpayment: cascade maintainer was set successfully: ${tx}`);
    // }
    // if (cascadeInfo.amount > 0) {
    //     console.log(`Hyperpayment: withdraw all the tokens for the ${purl}`);
    //     const tx = await cascadeWithdraw(purl!);
    //     console.log(`Hyperpayment: withdrawing cascaded tokens succeed: ${tx}`);
    // }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
})

