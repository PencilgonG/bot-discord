"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/infra/env.ts
require("dotenv/config");
exports.env = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
    GUILD_DEV_ID: process.env.GUILD_DEV_ID || "",
    DATABASE_URL: process.env.DATABASE_URL || "",
    ORGA_ROLE_ID: process.env.ORGA_ROLE_ID?.trim() || "",
    ORGA_USER_IDS: (process.env.ORGA_USER_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    MATCH_CHANNEL_ID: process.env.MATCH_CHANNEL_ID?.trim() || "",
    LINEUP_CHANNEL_ID: process.env.LINEUP_CHANNEL_ID?.trim() || "",
};
