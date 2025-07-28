import { SAD } from "./emoji";
import hyperpaymentAbi from "../abi/HYPERPAYMENT.json";
import customerAbi from "../abi/CUSTOMER.json";
import stablecoinAbi from "../abi/STABLECOIN.json";
import businessAbi from "../abi/BUSINESS.json";
import cascadeAbi from "../abi/CASCADE.json";
const nodeEnv = process.env.NODE_ENV || "development";

export enum EnvVar {
    NETWORK_URL = "NETWORK_URL",
    SERVER_PRIVATE_KEY = "SERVER_PRIVATE_KEY",
    HYPERPAYMENT_ADDRESS = "HYPERPAYMENT_ADDRESS",
    STABLECOIN_ADDRESS = "STABLECOIN_ADDRESS",
    CUSTOMER_ADDRESS = "CUSTOMER_ADDRESS",
    BUSINESS_ADDRESS = "BUSINESS_ADDRESS",
    CASCADE_ADDRESS = "CASCADE_ADDRESS",
    OPENSOURCE_HYPERPAYMENT_SPEC_ID = "OPENSOURCE_HYPERPAYMENT_SPEC_ID"
}

export enum ABI_NAME {
    HYPERPAYMENT,
    STABLECOIN,
    CUSTOMER,
    BUSINESS,
    CASCADE
}

export const abis: {[K in ABI_NAME]?: any} = {
    [ABI_NAME.HYPERPAYMENT]: hyperpaymentAbi,
    [ABI_NAME.CUSTOMER]: customerAbi,
    [ABI_NAME.STABLECOIN]: stablecoinAbi,
    [ABI_NAME.BUSINESS]: businessAbi,
    [ABI_NAME.CASCADE]: cascadeAbi,
}

const envDescriptions: { [K in EnvVar]?: string } = {
    NETWORK_URL: `blockchain rpc`,
    SERVER_PRIVATE_KEY: "private key with server role to hyperpayment smartcontracts",
    HYPERPAYMENT_ADDRESS: "smartcontract address of HyperpaymentV1",
    STABLECOIN_ADDRESS: "smartcontract address of USDC",
    CUSTOMER_ADDRESS: "smartcontract address of Customer Category",
    BUSINESS_ADDRESS: "smartcontract address of Business Category",
    CASCADE_ADDRESS: "smartcontract address of all collected fees through cascading",
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

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}