import { ReplyCascadeInfo, ReplyDepositInitiation, ReplyError, ReplyOk, ReplyProjectCreation, ReplyTx, ReplyWithdrawerInfo, Request } from "../types";
import { calculateAddress, cascadeWithdraw, createOpensourceProject, getCascadeWithdrawer, getWithdrawInfo, hyperpay, initialDepositPayload, setCascadeMaintainer, setWithdrawer, withdraw, withdrawAll } from "./cascadefund-smartcontracts";

export function isCascadefundPaymentReq(cmd: string): boolean {
    const cascadefundPaymentCommands = [
        "createProject",
        "initiateDeposit",
        "hyperpay",
        "setWithdrawer",
        "withdrawerInfo",
        "withdraw",
        "cascadeInfo",
        "setCascadeWithdrawer",
        "cascadeWithdraw"
    ];
    return cascadefundPaymentCommands.includes(cmd);
}

export async function cascadeFundRep(request: Request): Promise<ReplyOk | ReplyError | ReplyProjectCreation | ReplyDepositInitiation | ReplyTx | ReplyWithdrawerInfo | ReplyCascadeInfo> {
    console.log(`[DEBUG] cascadeFundRep called with command: ${request.cmd}`);
    console.log(`[DEBUG] Request params: ${JSON.stringify(request.params).substring(0, 500)}${JSON.stringify(request.params).length > 500 ? '...' : ''}`);
    
    if (request.cmd === "createProject") {
        console.log(`[DEBUG] Processing 'createProject' command`);
        try {
            console.log(`[DEBUG] Calling createOpensourceProject with params:`, request.params);
            const createdProject = await createOpensourceProject(request.params);
            console.log(`[DEBUG] createOpensourceProject completed, result:`, createdProject);
            const reply: ReplyProjectCreation = {
                time: Date.now(),
                params: createdProject
            }
            console.log(`[DEBUG] Constructed ReplyProjectCreation reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in createProject:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "initiateDeposit") {
        console.log(`[DEBUG] Processing 'initiateDeposit' command`);
        try {
            console.log(`[DEBUG] Encoding deposit payload...`);
            const encodedPayload = initialDepositPayload(request.params);
            console.log(`[DEBUG] Encoded payload: ${encodedPayload.substring(0, 100)}...`);
            console.log(`[DEBUG] Calculating address for specID: ${request.params.specID}, projectID: ${request.params.projectID}`);
            const calculatedAddress = await calculateAddress(request.params.specID, request.params.projectID, encodedPayload);
            console.log(`[DEBUG] Calculated address: ${calculatedAddress}`);
            const reply: ReplyDepositInitiation = {
                time: Date.now(),
                params: {
                    depositAddress: calculatedAddress,
                    payload: encodedPayload,
                }
            }
            console.log(`[DEBUG] Constructed ReplyDepositInitiation reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in initiateDeposit:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "hyperpay") {
        console.log(`[DEBUG] Processing 'hyperpay' command`);
        try {
            console.log(`[DEBUG] Encoding hyperpay payload...`);
            const encodedPayload = initialDepositPayload(request.params);
            console.log(`[DEBUG] Encoded payload: ${encodedPayload.substring(0, 100)}...`);
            console.log(`[DEBUG] Calling hyperpay with specID: ${request.params.specID}, projectID: ${request.params.projectID}`);
            const tx = await hyperpay(request.params.specID, request.params.projectID, encodedPayload);
            console.log(`[DEBUG] hyperpay completed, tx hash: ${tx}`);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx: tx,
                }
            }
            console.log(`[DEBUG] Constructed ReplyTx reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in hyperpay:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "setWithdrawer") {
        console.log(`[DEBUG] Processing 'setWithdrawer' command`);
        try {
            console.log(`[DEBUG] Calling setWithdrawer with specID: ${request.params.specID}, projectID: ${request.params.projectID}, withdrawer: ${request.params.withdrawer}`);
            const tx = await setWithdrawer(request.params.specID, request.params.projectID, request.params.withdrawer);
            console.log(`[DEBUG] setWithdrawer completed, tx hash: ${tx}`);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx: tx,
                }
            }
            console.log(`[DEBUG] Constructed ReplyTx reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in setWithdrawer:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "withdrawerInfo") {
        console.log(`[DEBUG] Processing 'withdrawerInfo' command`);
        try {
            console.log(`[DEBUG] Calling getWithdrawInfo with specID: ${request.params.specID}, projectID: ${request.params.projectID}`);
            const info = await getWithdrawInfo(request.params.specID, request.params.projectID);
            console.log(`[DEBUG] getWithdrawInfo completed, info:`, info);
            const reply: ReplyWithdrawerInfo = {
                time: Date.now(),
                params: info
            }
            console.log(`[DEBUG] Constructed ReplyWithdrawerInfo reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in withdrawerInfo:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "withdraw") {
        console.log(`[DEBUG] Processing 'withdraw' command`);
        try {
            let tx: string;
            if (request.params.all) {
                console.log(`[DEBUG] Withdrawing all tokens for specID: ${request.params.specID}, projectID: ${request.params.projectID}`);
                tx = await withdrawAll(request.params.specID, request.params.projectID);
            } else {
                console.log(`[DEBUG] Withdrawing ${request.params.amount} tokens for specID: ${request.params.specID}, projectID: ${request.params.projectID}`);
                tx = await withdraw(request.params.specID, request.params.projectID, request.params.amount);
            }
            console.log(`[DEBUG] withdraw completed, tx hash: ${tx}`);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx
                }
            }
            console.log(`[DEBUG] Constructed ReplyTx reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in withdraw:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "cascadeInfo") {
        console.log(`[DEBUG] Processing 'cascadeInfo' command`);
        try {
            console.log(`[DEBUG] Calling getCascadeWithdrawer with purl: ${request.params.purl}`);
            const cascadeInfo = await getCascadeWithdrawer(request.params.purl);
            console.log(`[DEBUG] getCascadeWithdrawer completed, info:`, cascadeInfo);
            const reply: ReplyCascadeInfo = {
                time: Date.now(),
                params: cascadeInfo
            }
            console.log(`[DEBUG] Constructed ReplyCascadeInfo reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in cascadeInfo:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "setCascadeWithdrawer") {
        console.log(`[DEBUG] Processing 'setCascadeWithdrawer' command`);
        try {
            console.log(`[DEBUG] Calling setCascadeMaintainer with purl: ${request.params.purl}, withdrawer: ${request.params.withdrawer}, username: ${request.params.username}, authProvider: ${request.params.authProvider}`);
            const tx = await setCascadeMaintainer(request.params.purl, request.params.withdrawer, request.params.username, request.params.authProvider);
            console.log(`[DEBUG] setCascadeMaintainer completed, tx hash: ${tx}`);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx
                }
            }
            console.log(`[DEBUG] Constructed ReplyTx reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in setCascadeWithdrawer:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "cascadeWithdraw") {
        console.log(`[DEBUG] Processing 'cascadeWithdraw' command`);
        try {
            console.log(`[DEBUG] Calling cascadeWithdraw with purl: ${request.params.purl}`);
            const tx = await cascadeWithdraw(request.params.purl);
            console.log(`[DEBUG] cascadeWithdraw completed, tx hash: ${tx}`);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx
                }
            }
            console.log(`[DEBUG] Constructed ReplyTx reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in cascadeWithdraw:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else {
        console.log(`[DEBUG] Unsupported command in cascadeFundRep: ${request.cmd}`);
        const reply: ReplyError = {
            error: `unsupported command`,
            time: Date.now(),
        }
        return reply;
    }
}

