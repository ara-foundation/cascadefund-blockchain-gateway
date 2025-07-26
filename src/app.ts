import { SAD } from "./emoji";
import hyperpaymentAbi from "../abi/HYPERPAYMENT.json";
const nodeEnv = process.env.NODE_ENV || "development";

export enum EnvVar {
    NETWORK_URL = "NETWORK_URL",
    SERVER_PRIVATE_KEY = "SERVER_PRIVATE_KEY",
    HYPERPAYMENT_ADDRESS = "HYPERPAYMENT_ADDRESS",
    STABLECOIN_ADDRESS = "STABLECOIN_ADDRESS",
    OPENSOURCE_HYPERPAYMENT_SPEC_ID = "OPENSOURCE_HYPERPAYMENT_SPEC_ID"
}

export enum ABI_NAME {
    HYPERPAYMENT,
    IERC20
}

export const abis: {[K in ABI_NAME]?: any} = {
    [ABI_NAME.HYPERPAYMENT]: hyperpaymentAbi,
}

const envDescriptions: { [K in EnvVar]?: string } = {
    NETWORK_URL: `blockchain rpc`,
    SERVER_PRIVATE_KEY: "private key with server role to hyperpayment smartcontracts",
    HYPERPAYMENT_ADDRESS: "smartcontract address of HyperpaymentV1",
    STABLECOIN_ADDRESS: "smartcontract address of USDC",
    OPENSOURCE_HYPERPAYMENT_SPEC_ID: "specification id in smartcontract"
}

export function isDev(): boolean {
    return nodeEnv === "development";
}

export function isProd(): boolean {
    return nodeEnv === "production";
}

export function getEnvVar(name: EnvVar): string {
    const value = process.env[name];
    if (value === undefined) {
        throw `${SAD} Please set '${name}' (${envDescriptions[name]}) environment variable`;
    }
    return value;
}