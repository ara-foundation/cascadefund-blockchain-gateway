import dotenv from "dotenv";
import { isDev, getEnvVar, EnvVar } from "./app";

if (isDev()) {
    dotenv.config({quiet: true, debug: false});
}

import { SMILEY } from "./emoji";
import { blockchainGreeting, createSampleProject, getLatestSpecId, getOpensourceSpecId, getProjectCounter, serverAddress } from "./blockchain";


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
    const latestSpecID = await getLatestSpecId();
    const latestOpensourceProjectId = await getProjectCounter(getOpensourceSpecId());
    console.log(`Hyperpayment: smartcontract has ${latestSpecID} specifications.`);
    console.log(`Hyperpayment: open-source specification id: ${getOpensourceSpecId()}`);
    console.log(`Hyperpayment: open-source specification has ${latestOpensourceProjectId} projects`);

    console.log(`Hyperpayment: create sample open-source project (this project itself)`);
    await createSampleProject();
    const recentOpensourceProjectId = await getProjectCounter(getOpensourceSpecId());
    console.log(`Hyperpayment: open-source specification has ${recentOpensourceProjectId} projects`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
})

