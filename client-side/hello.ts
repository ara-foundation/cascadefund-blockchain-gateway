import { type RequestHello } from "../src/server.types";
import { send } from "./client";

async function run() {
    const json: RequestHello = {
        "cmd": "hello",
    }

    const reply = await send(json);
    console.log(reply)
}

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
})