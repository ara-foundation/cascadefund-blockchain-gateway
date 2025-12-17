import { ReplyError, ReplyGalaxyCreation, ReplyGalaxyInfo, ReplyOk, ReplySolarForge, ReplyTx, Request } from "../types";
import { addGalaxy, getGalaxy, spaceCoord, solarForge } from "./ara-smartcontracts";

export function isAraAllStarsReq(cmd: string): boolean {
    const araAllStarsCommands = [
        "addGalaxy",
        "getGalaxy",
        "solarForge",
        "spaceCoord"
    ];
    return araAllStarsCommands.includes(cmd);
}

export async function araAllStarsRep(request: Request): Promise<ReplyOk | ReplyError | ReplyGalaxyCreation | ReplyGalaxyInfo | ReplySolarForge | ReplyTx> {
    console.log(`[DEBUG] araAllStarsRep called with command: ${request.cmd}`);
    console.log(`[DEBUG] Request params: ${JSON.stringify(request.params).substring(0, 500)}${JSON.stringify(request.params).length > 500 ? '...' : ''}`);
    
    if (request.cmd === "addGalaxy") {
        console.log(`[DEBUG] Processing 'addGalaxy' command`);
        try {
            console.log(`[DEBUG] Calling addGalaxy with params:`, request.params);
            const result = await addGalaxy(request.params);
            console.log(`[DEBUG] addGalaxy completed, result:`, result);
            const reply: ReplyGalaxyCreation = {
                time: Date.now(),
                params: result
            }
            console.log(`[DEBUG] Constructed ReplyGalaxyCreation reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in addGalaxy:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "getGalaxy") {
        console.log(`[DEBUG] Processing 'getGalaxy' command`);
        try {
            const galaxyId = request.params.galaxyId;
            console.log(`[DEBUG] Calling getGalaxy with galaxyId: ${galaxyId}`);
            const info = await getGalaxy(galaxyId);
            console.log(`[DEBUG] getGalaxy completed, info:`, info);
            const reply: ReplyGalaxyInfo = {
                time: Date.now(),
                params: info
            }
            console.log(`[DEBUG] Constructed ReplyGalaxyInfo reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in getGalaxy:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "solarForge") {
        console.log(`[DEBUG] Processing 'solarForge' command`);
        try {
            const galaxyId = request.params.galaxyId;
            const models = request.params.models;
            console.log(`[DEBUG] Calling solarForge with galaxyId: ${galaxyId}, models count: ${models?.length || 0}`);
            const result = await solarForge(galaxyId, models);
            console.log(`[DEBUG] solarForge completed, result:`, result);
            const reply: ReplySolarForge = {
                time: Date.now(),
                params: result
            }
            console.log(`[DEBUG] Constructed ReplySolarForge reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in solarForge:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else if (request.cmd === "spaceCoord") {
        console.log(`[DEBUG] Processing 'spaceCoord' command`);
        try {
            const galaxyId = request.params.galaxyId;
            const position = request.params.position;
            console.log(`[DEBUG] Calling spaceCoord with galaxyId: ${galaxyId}, position:`, position);
            const tx = await spaceCoord(galaxyId, position);
            console.log(`[DEBUG] spaceCoord completed, tx hash: ${tx}`);
            const reply: ReplyTx = {
                time: Date.now(),
                params: {
                    tx: tx
                }
            }
            console.log(`[DEBUG] Constructed ReplyTx reply`);
            return reply;
        } catch (error: any) {
            console.error(`[DEBUG] Error in spaceCoord:`, error);
            const reply: ReplyError = {
                error: error.message || String(error),
                time: Date.now(),
            }
            return reply;
        }
    } else {
        console.log(`[DEBUG] Unsupported command in araAllStarsRep: ${request.cmd}`);
        const reply: ReplyError = {
            error: `unsupported command`,
            time: Date.now(),
        }
        return reply;
    }
}

