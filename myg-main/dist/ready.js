"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReady = onReady;
// src/ready.ts
const discord_js_1 = require("discord.js");
const pino_1 = __importDefault(require("pino"));
const commands_1 = require("./config/commands");
const log = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
async function onReady(client) {
    const token = process.env.DISCORD_TOKEN;
    const appId = process.env.DISCORD_CLIENT_ID;
    const devGuildId = process.env.DEV_GUILD_ID;
    const rest = new discord_js_1.REST({ version: '10' }).setToken(token);
    if (devGuildId) {
        await rest.put(discord_js_1.Routes.applicationGuildCommands(appId, devGuildId), { body: commands_1.allCommands });
        log.info('Slash commands registered to DEV guild');
    }
    else {
        await rest.put(discord_js_1.Routes.applicationCommands(appId), { body: commands_1.allCommands });
        log.info('Slash commands registered globally');
    }
}
