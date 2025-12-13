import { CreateProject, InitialDeposit, InitialDepositParams, OpensourceUsers, WithdrawerInfo } from "./blockchain"

export type RequestProjectCreation = {
    cmd: "createProject",
    params: OpensourceUsers
}
export type RequestHello = {
    cmd: "hello",
    params?: {}
}
export type RequestDepositInitiation = {
    cmd: "initiateDeposit",
    params: InitialDepositParams & {
        specID: number,
        projectID: number,
    },
}
export type RequestHyperpay = Omit<RequestDepositInitiation, "cmd"> & {
    cmd: "hyperpay",
}
export type RequestSetWithdrawer = {
    cmd: "setWithdrawer",
    params: {
        specID: number,
        projectID: number,
        withdrawer: string,
    }
}
export type RequestWithdrawerInfo = {
    cmd: "withdrawerInfo",
    params: {
        specID: number,
        projectID: number,
    }
}
export type RequestWithdraw = {
    cmd: "withdraw",
    params: {
        specID: number,
        projectID: number,
        amount: string,
        all: boolean,
    }
}
export type RequestSetCascadeWithdrawer = {
    cmd: "setCascadeWithdrawer",
    params: {
        purl: string,
        withdrawer: string,
        username: string,
        authProvider: string
    }
}

export type RequestCascadeInfo = {
    cmd: "cascadeInfo",
    params: {
        purl: string
    }
}

export type RequestCascadeWithdraw = {
    cmd: "cascadeWithdraw",
    params: {
        purl: string
    }
}

export type ReplyError = {
    error: string,
    time: number,
}
export type ReplyOk = {
    time: number
}
export type ReplyWithdrawerInfo = ReplyOk & {
    params: WithdrawerInfo
}
export type ReplyCascadeInfo = ReplyOk & {
    params: Omit<WithdrawerInfo, "resourceToken">
}
export type ReplyTx = ReplyOk & {
    params: {
        tx: string
    }
}
export type ReplyProjectCreation = {
    time: number,
    params: CreateProject
}
export type ReplyDepositInitiation = ReplyOk & {
    params: InitialDeposit
};
export type Reply = 
    ReplyOk | 
    ReplyError | 
    ReplyProjectCreation |
    ReplyDepositInitiation |
    ReplyTx | 
    ReplyWithdrawerInfo |
    ReplyCascadeInfo;
export type Request = 
    RequestHello | 
    RequestProjectCreation |
    RequestDepositInitiation | 
    RequestHyperpay | 
    RequestSetWithdrawer |
    RequestWithdrawerInfo | 
    RequestWithdraw |
    RequestCascadeInfo |
    RequestSetCascadeWithdrawer |
    RequestCascadeWithdraw;
