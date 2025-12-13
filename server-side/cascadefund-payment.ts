import { ReplyCascadeInfo, ReplyDepositInitiation, ReplyError, ReplyOk, ReplyProjectCreation, ReplyTx, ReplyWithdrawerInfo, Request } from "./server.types";
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
    if (request.cmd === "createProject") {
        const createdProject = await createOpensourceProject(request.params);
        const reply: ReplyProjectCreation = {
            time: Date.now(),
            params: createdProject
        }
        return reply;
    } else if (request.cmd === "initiateDeposit") {
        const encodedPayload = initialDepositPayload(request.params);
        const calculatedAddress = await calculateAddress(request.params.specID, request.params.projectID, encodedPayload);
        const reply: ReplyDepositInitiation = {
            time: Date.now(),
            params: {
                depositAddress: calculatedAddress,
                payload: encodedPayload,
            }
        }
        return reply;
    } else if (request.cmd === "hyperpay") {
        const encodedPayload = initialDepositPayload(request.params);
        const tx = await hyperpay(request.params.specID, request.params.projectID, encodedPayload);
        const reply: ReplyTx = {
            time: Date.now(),
            params: {
                tx: tx,
            }
        }
        return reply;
    } else if (request.cmd === "setWithdrawer") {
        const tx = await setWithdrawer(request.params.specID, request.params.projectID, request.params.withdrawer);
        const reply: ReplyTx = {
            time: Date.now(),
            params: {
                tx: tx,
            }
        }
        return reply;
    } else if (request.cmd === "withdrawerInfo") {
        const info = await getWithdrawInfo(request.params.specID, request.params.projectID);
        const reply: ReplyWithdrawerInfo = {
            time: Date.now(),
            params: info
        }
        return reply;
    } else if (request.cmd === "withdraw") {
        let tx: string;
        if (request.params.all) {
            tx = await withdrawAll(request.params.specID, request.params.projectID);
        } else {
            tx = await withdraw(request.params.specID, request.params.projectID, request.params.amount);
        }
        const reply: ReplyTx = {
            time: Date.now(),
            params: {
                tx
            }
        }
        return reply;
    } else if (request.cmd === "cascadeInfo") {
        const cascadeInfo = await getCascadeWithdrawer(request.params.purl);
        const reply: ReplyCascadeInfo = {
            time: Date.now(),
            params: cascadeInfo
        }
        return reply;
    } else if (request.cmd === "setCascadeWithdrawer") {
        const tx = await setCascadeMaintainer(request.params.purl, request.params.withdrawer, request.params.username, request.params.authProvider);
        const reply: ReplyTx = {
            time: Date.now(),
            params: {
                tx
            }
        }
        return reply;
    } else if (request.cmd === "cascadeWithdraw") {
        const tx = await cascadeWithdraw(request.params.purl);
        const reply: ReplyTx = {
            time: Date.now(),
            params: {
                tx
            }
        }
        return reply;
    } else {
        const reply: ReplyError = {
            error: `unsupported command`,
            time: Date.now(),
        }
        return reply;
    }
}

