import { CreateProject, InitialDeposit, InitialDepositParams, OpensourceUsers, WithdrawerInfo } from "./cascadefund-smartcontracts"

// Generic serialized types (as received from MongoDB/TypeScript)
// Matches addGalaxy function signature: address owner_, string repoUrl_, string issuesUrl_, string name_, uint256 id_, uint256 minX, uint256 maxX, uint256 minY, uint256 maxY
export type SerializedGalaxy = {
    owner: string; // address
    repoUrl: string;
    issuesUrl: string;
    name: string;
    id: number; // uint256
    minX: number; // uint256
    maxX: number; // uint256
    minY: number; // uint256
    maxY: number; // uint256
}

// Matches spaceCoord function signature: uint256 galaxyId, address userId, uint256 x, uint256 y
export type SerializedPosition = {
    userId: string; // address
    x: number; // uint256
    y: number; // uint256
}

// Matches SolarForge struct: string _id, string solarForgeType, string issueId, address[] users, uint256 stars
export type SerializedSolarForge = {
    _id: string;
    solarForgeType: string;
    issueId: string;
    users: string[]; // address[]
    stars: number; // uint256
}

export type GalaxyResult = {
    txHash: string;
    galaxyId: string;
}

export type GalaxyInfo = {
    galaxyId: string;
    maintainer: string;
    name: string;
    stars: number;
    sunshines: number;
    x: number;
    y: number;
}

export type SolarForgeResult = {
    txHash: string;
    solarForgeId: string;
}

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

export type RequestAddGalaxy = {
    cmd: "addGalaxy",
    params: SerializedGalaxy
}

export type RequestGetGalaxy = {
    cmd: "getGalaxy",
    params: {
        galaxyId: number
    }
}

export type RequestSolarForge = {
    cmd: "solarForge",
    params: {
        galaxyId: number,
        models: SerializedSolarForge[]
    }
}

export type RequestSpaceCoord = {
    cmd: "spaceCoord",
    params: {
        galaxyId: number,
        position: SerializedPosition
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
export type ReplyGalaxyCreation = {
    time: number,
    params: GalaxyResult
}
export type ReplyGalaxyInfo = ReplyOk & {
    params: GalaxyInfo
}
export type ReplySolarForge = {
    time: number,
    params: SolarForgeResult
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
    ReplyCascadeInfo |
    ReplyGalaxyCreation |
    ReplyGalaxyInfo |
    ReplySolarForge;
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
    RequestCascadeWithdraw |
    RequestAddGalaxy |
    RequestGetGalaxy |
    RequestSolarForge |
    RequestSpaceCoord;
