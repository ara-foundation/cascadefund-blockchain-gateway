import { JsonRpcProvider, Wallet } from "ethers";
import deployedContracts from "@ara-web/cascadefund-smartcontracts/lib/deployed_contracts.json"
import { EnvVar, getEnvVar } from "./app";

export const networkID = getEnvVar(EnvVar.NETWORK_ID) as keyof typeof deployedContracts;
const networkUrl = getEnvVar(EnvVar.NETWORK_URL);
const serverPrivateKey = getEnvVar(EnvVar.SERVER_PRIVATE_KEY);
export const provider = new JsonRpcProvider(networkUrl);
export const signer = new Wallet(serverPrivateKey, provider);

export const serverAddress = signer.address;


export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

// Cascadefund-smartcontracts types
export type CategoryName = string;

export type CategoryBusiness = {
    purl: string; //"pkg:git@github.com/ara-foundation/cascade-blockchain-gateway.git"
    username: string; //"ahmetson";
    authProvider: string; // "github.com";
    withdraw: string;
}

export type User = {
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

// Generic serialized types (as received from MongoDB/TypeScript)
// Matches addGalaxy function signature: address owner_, string repoUrl_, string issuesUrl_, string name_, uint256 id_, uint256 minX, uint256 maxX, uint256 minY, uint256 maxY
export type SerializedGalaxy = {
    owner: string; // address
    repoUrl: string;
    issuesUrl: string;
    name: string;
    id: string; // uint256 (as hex string)
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
    msgId?: number,
    params: OpensourceUsers
}
export type RequestHello = {
    cmd: "hello",
    msgId?: number,
    params?: {}
}
export type RequestDepositInitiation = {
    cmd: "initiateDeposit",
    msgId?: number,
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
    msgId?: number,
    params: {
        specID: number,
        projectID: number,
        withdrawer: string,
    }
}
export type RequestWithdrawerInfo = {
    cmd: "withdrawerInfo",
    msgId?: number,
    params: {
        specID: number,
        projectID: number,
    }
}
export type RequestWithdraw = {
    cmd: "withdraw",
    msgId?: number,
    params: {
        specID: number,
        projectID: number,
        amount: string,
        all: boolean,
    }
}
export type RequestSetCascadeWithdrawer = {
    cmd: "setCascadeWithdrawer",
    msgId?: number,
    params: {
        purl: string,
        withdrawer: string,
        username: string,
        authProvider: string
    }
}

export type RequestCascadeInfo = {
    cmd: "cascadeInfo",
    msgId?: number,
    params: {
        purl: string
    }
}

export type RequestCascadeWithdraw = {
    cmd: "cascadeWithdraw",
    msgId?: number,
    params: {
        purl: string
    }
}

export type RequestAddGalaxy = {
    cmd: "addGalaxy",
    msgId?: number,
    params: SerializedGalaxy
}

export type RequestGetGalaxy = {
    cmd: "getGalaxy",
    msgId?: number,
    params: {
        galaxyId: string
    }
}

export type RequestSolarForge = {
    cmd: "solarForge",
    msgId?: number,
    params: {
        galaxyId: string,
        models: SerializedSolarForge[]
    }
}

export type RequestSpaceCoord = {
    cmd: "spaceCoord",
    msgId?: number,
    params: {
        galaxyId: string,
        position: SerializedPosition
    }
}

export type RequestHeartbeat = {
    cmd: "heartbeat",
    msgId?: number
}

export type ReplyError = {
    error: string,
    msgId: number,
    time: number,
}
export type ReplyOk = {
    msgId: number,
    time: number
}
export type ReplyWithdrawerInfo = ReplyOk & {
    params: WithdrawerInfo
}
export type ReplyCascadeInfo = ReplyOk & {
    params: Omit<WithdrawerInfo, "resourceToken">
}
export type ReplyGalaxyCreation = {
    msgId: number,
    time: number,
    params: GalaxyResult
}
export type ReplyGalaxyInfo = ReplyOk & {
    params: GalaxyInfo
}
export type ReplySolarForge = {
    msgId: number,
    time: number,
    params: SolarForgeResult
}
export type ReplyTx = ReplyOk & {
    params: {
        tx: string
    }
}
export type ReplyProjectCreation = {
    msgId: number,
    time: number,
    params: CreateProject
}
export type ReplyDepositInitiation = ReplyOk & {
    params: InitialDeposit
};
export type ReplyHeartbeat = {
    cmd: "heartbeat",
    msgId: number,
    time: number
}
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
    ReplySolarForge |
    ReplyHeartbeat;
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
    RequestSpaceCoord |
    RequestHeartbeat;
