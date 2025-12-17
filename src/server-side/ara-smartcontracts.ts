import {
    Contract,
    ContractTransactionResponse,
    JsonRpcProvider,
    Wallet
} from "ethers";
import { EnvVar, getEnvVar } from "../app";
import { SAD } from "../emoji";
import { SerializedGalaxy, SerializedPosition, SerializedSolarForge, GalaxyResult, GalaxyInfo, SolarForgeResult } from "../types";

// Import smartcontracts - tsx handles ESM imports properly
import { allStarsAbi, allStarsAddress } from "@ara-web/smartcontracts";

const networkID = parseInt(getEnvVar(EnvVar.NETWORK_ID)) as unknown as keyof typeof allStarsAddress;
const networkUrl = getEnvVar(EnvVar.NETWORK_URL);
const serverPrivateKey = getEnvVar(EnvVar.SERVER_PRIVATE_KEY);

// Setup provider and signer for ethers
console.log(`[DEBUG] Initializing blockchain connection...`);
console.log(`[DEBUG] Network URL: ${networkUrl}`);
console.log(`[DEBUG] Network ID: ${String(networkID)}`);
const provider = new JsonRpcProvider(networkUrl);
console.log(`[DEBUG] Provider created`);
const signer = new Wallet(serverPrivateKey, provider);
export const serverAddress = signer.address;
console.log(`[DEBUG] Wallet/signer created, address: ${String(serverAddress)}`);

// Setup contracts
const allStarsContractAddress = allStarsAddress[networkID];
if (!allStarsContractAddress) {
    throw new Error(`${SAD} Network ID ${String(networkID)} is not supported. Available networks: ${Object.keys(allStarsAddress).join(', ')}`);
}
console.log(`[DEBUG] Contract address for network ${String(networkID)}: ${allStarsContractAddress}`);
const allStarsContract = new Contract(allStarsContractAddress, allStarsAbi, signer);
console.log(`[DEBUG] Contract instance created`);

/**
 * Convert serialized types to blockchain types
 */
function convertSolarForgeToBlockchain(solarForge: SerializedSolarForge): any {
    console.log(`[DEBUG] Converting solarForge to blockchain format:`, solarForge);
    // Convert stars to wei format (1 ether = 10^18 wei)
    // Handle decimal numbers by multiplying first, then converting to BigInt
    const starsValue = typeof solarForge.stars === 'number' ? solarForge.stars : parseFloat(String(solarForge.stars));
    const starsInWei = BigInt(Math.floor(starsValue * 10 ** 18));
    console.log(`[DEBUG] Converted stars: ${starsValue} -> ${starsInWei} wei`);
    const result = {
        _id: solarForge._id,
        solarForgeType: solarForge.solarForgeType,
        issueId: solarForge.issueId,
        users: solarForge.users,
        stars: starsInWei
    };
    console.log(`[DEBUG] Converted solarForge result:`, result);
    return result;
}

/**
 * Add a new galaxy on the blockchain
 * Matches: addGalaxy(address owner_, string repoUrl_, string issuesUrl_, string name_, uint256 id_, uint256 minX, uint256 maxX, uint256 minY, uint256 maxY)
 */
export async function addGalaxy(galaxy: SerializedGalaxy): Promise<GalaxyResult> {
    console.log(`[DEBUG] addGalaxy called with params:`, galaxy);
    try {
        // Convert hex string id to BigInt
        console.log(`[DEBUG] Converting galaxy.id to BigInt: ${galaxy.id}`);
        const galaxyIdBigInt = BigInt(galaxy.id);
        console.log(`[DEBUG] Converted galaxyId: ${galaxyIdBigInt}`);

        console.log(`[DEBUG] Preparing contract call parameters:`);
        console.log(`[DEBUG]   owner: ${galaxy.owner}`);
        console.log(`[DEBUG]   repoUrl: ${galaxy.repoUrl}`);
        console.log(`[DEBUG]   issuesUrl: ${galaxy.issuesUrl}`);
        console.log(`[DEBUG]   name: ${galaxy.name}`);
        console.log(`[DEBUG]   id: ${galaxyIdBigInt}`);
        console.log(`[DEBUG]   minX: ${BigInt(galaxy.minX)}, maxX: ${BigInt(galaxy.maxX)}`);
        console.log(`[DEBUG]   minY: ${BigInt(galaxy.minY)}, maxY: ${BigInt(galaxy.maxY)}`);

        console.log(`[DEBUG] Calling allStarsContract.addGalaxy()...`);
        const tx: ContractTransactionResponse = await allStarsContract["addGalaxy"](
            galaxy.owner,
            galaxy.repoUrl,
            galaxy.issuesUrl,
            galaxy.name,
            galaxyIdBigInt,
            BigInt(galaxy.minX),
            BigInt(galaxy.maxX),
            BigInt(galaxy.minY),
            BigInt(galaxy.maxY)
        );
        console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);

        console.log(`Blockchain: add galaxy transaction submitted, tx = ${tx.hash}, confirming...`);
        console.log(`[DEBUG] Waiting for transaction confirmation...`);
        const receipt = await tx.wait();
        console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
        console.log(`Blockchain: galaxy addition transaction was confirmed ${tx.hash}`);

        const result = {
            txHash: tx.hash,
            galaxyId: galaxy.id
        };
        console.log(`[DEBUG] addGalaxy returning result:`, result);
        return result;
    } catch (error: any) {
        console.error(`[DEBUG] Error in addGalaxy:`, error);
        console.error(`[DEBUG] Error message: ${error.message}`);
        console.error(`[DEBUG] Error stack:`, error.stack);
        throw new Error(`Failed to add galaxy: ${error.message}`);
    }
}

/**
 * Get galaxy information from the blockchain
 */
export async function getGalaxy(galaxyId: string): Promise<GalaxyInfo> {
    console.log(`[DEBUG] getGalaxy called with galaxyId: ${galaxyId}`);
    try {
        console.log(`[DEBUG] Converting galaxyId to BigInt: ${galaxyId}`);
        const galaxyIdBigInt = BigInt(galaxyId);
        console.log(`[DEBUG] Converted galaxyId: ${galaxyIdBigInt}`);

        console.log(`[DEBUG] Calling allStarsContract.galaxies(${galaxyIdBigInt})...`);
        const result = await allStarsContract["galaxies"](galaxyIdBigInt);
        console.log(`[DEBUG] Contract call returned, result:`, result);

        const galaxyInfo = {
            galaxyId: galaxyId,
            maintainer: result.owner as string,
            name: result.name as string,
            stars: 0, // Not directly available in GalaxyData struct
            sunshines: 0, // Not directly available in GalaxyData struct
            x: Number(result.space.minX as bigint),
            y: Number(result.space.minY as bigint)
        };
        console.log(`[DEBUG] Constructed galaxyInfo:`, galaxyInfo);
        console.log(`[DEBUG] getGalaxy returning result`);
        return galaxyInfo;
    } catch (error: any) {
        console.error(`[DEBUG] Error in getGalaxy:`, error);
        console.error(`[DEBUG] Error message: ${error.message}`);
        console.error(`[DEBUG] Error stack:`, error.stack);
        throw new Error(`Failed to get galaxy: ${error.message}`);
    }
}

/**
 * Perform solar forge operation
 * Matches: solarForge(uint256 galaxyId, SolarForge[] calldata models)
 * SolarForge struct: string _id, string solarForgeType, string issueId, address[] users, uint256 stars
 */
export async function solarForge(galaxyId: string, models: SerializedSolarForge[]): Promise<SolarForgeResult> {
    console.log(`[DEBUG] solarForge called with galaxyId: ${galaxyId}, models count: ${models.length}`);
    try {
        console.log(`[DEBUG] Converting ${models.length} models to blockchain format...`);
        const blockchainModels = models.map(model => convertSolarForgeToBlockchain(model));
        console.log(`[DEBUG] Converted ${blockchainModels.length} models`);
        
        console.log(`[DEBUG] Converting galaxyId to BigInt: ${galaxyId}`);
        const galaxyIdBigInt = BigInt(galaxyId);
        console.log(`[DEBUG] Converted galaxyId: ${galaxyIdBigInt}`);

        console.log(`[DEBUG] Calling allStarsContract.solarForge(${galaxyIdBigInt}, [${blockchainModels.length} models])...`);
        const tx: ContractTransactionResponse = await allStarsContract["solarForge"](
            galaxyIdBigInt,
            blockchainModels
        );
        console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);

        console.log(`Blockchain: solar forge transaction submitted, tx = ${tx.hash}, confirming...`);
        console.log(`[DEBUG] Waiting for transaction confirmation...`);
        const receipt = await tx.wait();
        console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
        console.log(`Blockchain: solar forge transaction was confirmed ${tx.hash}`);

        const result = {
            txHash: tx.hash,
            solarForgeId: models[0]?._id || ""
        };
        console.log(`[DEBUG] solarForge returning result:`, result);
        return result;
    } catch (error: any) {
        console.error(`[DEBUG] Error in solarForge:`, error);
        console.error(`[DEBUG] Error message: ${error.message}`);
        console.error(`[DEBUG] Error stack:`, error.stack);
        throw new Error(`Failed to perform solar forge: ${error.message}`);
    }
}

/**
 * Set position for a user in a galaxy
 * Matches: spaceCoord(uint256 galaxyId, address userId, uint256 x, uint256 y)
 */
export async function spaceCoord(galaxyId: string, position: SerializedPosition): Promise<string> {
    console.log(`[DEBUG] spaceCoord called with galaxyId: ${galaxyId}, position:`, position);
    try {
        console.log(`[DEBUG] Converting galaxyId to BigInt: ${galaxyId}`);
        const galaxyIdBigInt = BigInt(galaxyId);
        console.log(`[DEBUG] Converted galaxyId: ${galaxyIdBigInt}`);
        
        // Convert floating point coordinates to integers before converting to BigInt
        console.log(`[DEBUG] Converting coordinates: x=${position.x}, y=${position.y}`);
        const xInt = Math.floor(position.x);
        const yInt = Math.floor(position.y);
        console.log(`[DEBUG] Floored coordinates: x=${xInt}, y=${yInt}`);
        const xBigInt = BigInt(xInt);
        const yBigInt = BigInt(yInt);
        console.log(`[DEBUG] Converted to BigInt: x=${xBigInt}, y=${yBigInt}`);

        console.log(`[DEBUG] Calling allStarsContract.spaceCoord(${galaxyIdBigInt}, ${position.userId}, ${xBigInt}, ${yBigInt})...`);
        const tx: ContractTransactionResponse = await allStarsContract["spaceCoord"](
            galaxyIdBigInt,
            position.userId,
            xBigInt,
            yBigInt
        );
        console.log(`[DEBUG] Contract call returned, tx hash: ${tx.hash}`);

        console.log(`[DEBUG] Waiting for transaction confirmation...`);
        const receipt = await tx.wait();
        console.log(`[DEBUG] Transaction confirmed, block number: ${receipt?.blockNumber}, gas used: ${receipt?.gasUsed?.toString()}`);
        console.log(`[DEBUG] spaceCoord returning tx hash: ${tx.hash}`);
        return tx.hash;
    } catch (error: any) {
        console.error(`[DEBUG] Error in spaceCoord:`, error);
        console.error(`[DEBUG] Error message: ${error.message}`);
        console.error(`[DEBUG] Error stack:`, error.stack);
        throw new Error(`Failed to set space coord: ${error.message}`);
    }
}

