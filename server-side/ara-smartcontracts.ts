import {
    Contract,
    ContractTransactionResponse,
    JsonRpcProvider,
    Wallet
} from "ethers";
import { EnvVar, getEnvVar } from "./app";
import { SAD } from "./emoji";
import { allStarsAbi, allStarsAddress } from "@ara-web/smartcontracts";
import { SerializedGalaxy, SerializedPosition, SerializedSolarForge, GalaxyResult, GalaxyInfo, SolarForgeResult } from "./server.types";

const networkID = parseInt(getEnvVar(EnvVar.NETWORK_ID)) as keyof typeof allStarsAddress;
const networkUrl = getEnvVar(EnvVar.NETWORK_URL);
const serverPrivateKey = getEnvVar(EnvVar.SERVER_PRIVATE_KEY);

// Setup provider and signer for ethers
const provider = new JsonRpcProvider(networkUrl);
const signer = new Wallet(serverPrivateKey, provider);
export const serverAddress = signer.address;

// Setup contracts
const allStarsContractAddress = allStarsAddress[networkID];
if (!allStarsContractAddress) {
    throw new Error(`${SAD} Network ID ${networkID} is not supported. Available networks: ${Object.keys(allStarsAddress).join(', ')}`);
}
const allStarsContract = new Contract(allStarsContractAddress, allStarsAbi, signer);

/**
 * Convert serialized types to blockchain types
 */
function convertSolarForgeToBlockchain(solarForge: SerializedSolarForge): any {
    // Convert stars to wei format (1 ether = 10^18 wei)
    const starsInWei = BigInt(solarForge.stars) * BigInt(10 ** 18);
    return {
        _id: solarForge._id,
        solarForgeType: solarForge.solarForgeType,
        issueId: solarForge.issueId,
        users: solarForge.users,
        stars: starsInWei
    };
}

/**
 * Add a new galaxy on the blockchain
 * Matches: addGalaxy(address owner_, string repoUrl_, string issuesUrl_, string name_, uint256 id_, uint256 minX, uint256 maxX, uint256 minY, uint256 maxY)
 */
export async function addGalaxy(galaxy: SerializedGalaxy): Promise<GalaxyResult> {
    try {
        const tx: ContractTransactionResponse = await allStarsContract["addGalaxy"](
            galaxy.owner,
            galaxy.repoUrl,
            galaxy.issuesUrl,
            galaxy.name,
            BigInt(galaxy.id),
            BigInt(galaxy.minX),
            BigInt(galaxy.maxX),
            BigInt(galaxy.minY),
            BigInt(galaxy.maxY)
        );

        console.log(`Blockchain: add galaxy transaction submitted, tx = ${tx.hash}, confirming...`);
        await tx.wait();
        console.log(`Blockchain: galaxy addition transaction was confirmed ${tx.hash}`);

        return {
            txHash: tx.hash,
            galaxyId: galaxy.id.toString()
        };
    } catch (error: any) {
        throw new Error(`Failed to add galaxy: ${error.message}`);
    }
}

/**
 * Get galaxy information from the blockchain
 */
export async function getGalaxy(galaxyId: number): Promise<GalaxyInfo> {
    try {
        const result = await allStarsContract["galaxies"](BigInt(galaxyId));

        return {
            galaxyId: galaxyId.toString(),
            maintainer: result.owner as string,
            name: result.name as string,
            stars: 0, // Not directly available in GalaxyData struct
            sunshines: 0, // Not directly available in GalaxyData struct
            x: Number(result.space.minX as bigint),
            y: Number(result.space.minY as bigint)
        };
    } catch (error: any) {
        throw new Error(`Failed to get galaxy: ${error.message}`);
    }
}

/**
 * Perform solar forge operation
 * Matches: solarForge(uint256 galaxyId, SolarForge[] calldata models)
 * SolarForge struct: string _id, string solarForgeType, string issueId, address[] users, uint256 stars
 */
export async function solarForge(galaxyId: number, models: SerializedSolarForge[]): Promise<SolarForgeResult> {
    try {
        const blockchainModels = models.map(model => convertSolarForgeToBlockchain(model));

        const tx: ContractTransactionResponse = await allStarsContract["solarForge"](
            BigInt(galaxyId),
            blockchainModels
        );

        console.log(`Blockchain: solar forge transaction submitted, tx = ${tx.hash}, confirming...`);
        await tx.wait();
        console.log(`Blockchain: solar forge transaction was confirmed ${tx.hash}`);

        return {
            txHash: tx.hash,
            solarForgeId: models[0]?._id || ""
        };
    } catch (error: any) {
        throw new Error(`Failed to perform solar forge: ${error.message}`);
    }
}

/**
 * Set position for a user in a galaxy
 * Matches: spaceCoord(uint256 galaxyId, address userId, uint256 x, uint256 y)
 */
export async function spaceCoord(galaxyId: number, position: SerializedPosition): Promise<string> {
    try {
        const tx: ContractTransactionResponse = await allStarsContract["spaceCoord"](
            BigInt(galaxyId),
            position.userId,
            BigInt(position.x),
            BigInt(position.y)
        );

        console.log(`Blockchain: space coord transaction submitted, tx = ${tx.hash}, confirming...`);
        await tx.wait();
        console.log(`Blockchain: space coord transaction was confirmed ${tx.hash}`);

        return tx.hash;
    } catch (error: any) {
        throw new Error(`Failed to set space coord: ${error.message}`);
    }
}

