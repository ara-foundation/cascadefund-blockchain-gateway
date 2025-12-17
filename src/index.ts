// Client-side entry point for npm module
// This file exports all client-side functionality

export { send } from "./client-side/client";
export * from "./types";
export { EMPTY_ADDRESS } from "./types";

// Re-export client-side utilities if needed
export * from "./client-side/client";
