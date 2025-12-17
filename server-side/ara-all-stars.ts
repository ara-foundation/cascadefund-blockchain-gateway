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
    if (request.cmd === "addGalaxy") {
        const result = await addGalaxy(request.params);
        const reply: ReplyGalaxyCreation = {
            time: Date.now(),
            params: result
        }
        return reply;
    } else if (request.cmd === "getGalaxy") {
        const info = await getGalaxy(request.params.galaxyId);
        const reply: ReplyGalaxyInfo = {
            time: Date.now(),
            params: info
        }
        return reply;
    } else if (request.cmd === "solarForge") {
        const result = await solarForge(request.params.galaxyId, request.params.models);
        const reply: ReplySolarForge = {
            time: Date.now(),
            params: result
        }
        return reply;
    } else if (request.cmd === "spaceCoord") {
        const tx = await spaceCoord(request.params.galaxyId, request.params.position);
        const reply: ReplyTx = {
            time: Date.now(),
            params: {
                tx: tx
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

