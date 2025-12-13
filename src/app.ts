import { SAD } from "./emoji";
const nodeEnv = process.env.NODE_ENV || "development";

export enum EnvVar {
    PORT = "PORT",
    HOST = "HOST",
    NETWORK_ID = "NETWORK_ID",
    NETWORK_URL = "NETWORK_URL",
    SERVER_PRIVATE_KEY = "SERVER_PRIVATE_KEY",
    OPENSOURCE_HYPERPAYMENT_SPEC_ID = "OPENSOURCE_HYPERPAYMENT_SPEC_ID"
}

const envDescriptions: { [K in EnvVar]?: string } = {
    PORT: "port where it will expose reply worker",
    NETWORK_ID: "chain id",
    HOST: "host where reply workers set",
    NETWORK_URL: `blockchain rpc`,
    SERVER_PRIVATE_KEY: "private key with server role to hyperpayment smartcontracts",
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