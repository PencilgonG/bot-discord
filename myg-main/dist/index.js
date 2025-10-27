"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
require("dotenv/config");
const discord_js_1 = require("discord.js");
const register_js_1 = require("./bot/interactions/register.js");
const dispatcher_js_1 = require("./bot/interactions/dispatcher.js");
// ───────────────────────────────── client ─────────────────────────────────
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers, // utile si tu lis des pseudos/roles
        discord_js_1.GatewayIntentBits.GuildMessages,
    ],
    partials: [discord_js_1.Partials.Channel],
});
// ─────────────────────────────── ready: register ───────────────────────────────
client.once(discord_js_1.Events.ClientReady, async () => {
    try {
        const token = (process.env.DISCORD_TOKEN || "").trim();
        const guildId = process.env.GUILD_DEV_ID?.trim();
        const appId = client.application?.id;
        if (!appId) {
            console.error("❌ Application non prête (pas d'appId).");
            return;
        }
        await (0, register_js_1.registerSlashCommands)(appId, token, guildId);
        console.log(`✅ Connecté en tant que ${client.user?.tag}`);
        // petite présence
        client.user?.setPresence({
            activities: [{ name: "inhouse lobby", type: discord_js_1.ActivityType.Watching }],
            status: "online",
        });
    }
    catch (err) {
        console.error("❌ Échec initialisation:", err);
    }
});
// ───────────────────────────── interactions ─────────────────────────────
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            return (0, dispatcher_js_1.handleSlash)(interaction);
        }
        if (interaction.isButton() ||
            interaction.isStringSelectMenu() ||
            interaction.isModalSubmit()) {
            return (0, dispatcher_js_1.handleInteractionComponent)(interaction);
        }
    }
    catch (err) {
        console.error("Erreur durant InteractionCreate:", err);
        if (interaction.isRepliable()) {
            try {
                await interaction.reply({
                    content: "❌ Une erreur est survenue.",
                    ephemeral: true,
                });
            }
            catch { }
        }
    }
});
// ─────────────────────────────── login ───────────────────────────────
const raw = (process.env.DISCORD_TOKEN || "").trim();
if (!raw || raw.split(".").length !== 3) {
    console.error("DISCORD_TOKEN manquant ou invalide. Assure-toi d'avoir .env avec DISCORD_TOKEN et GUILD_DEV_ID.");
    process.exit(1);
}
client.login(raw);
