"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLobbyCategoryPersist = ensureLobbyCategoryPersist;
exports.ensureTeamResources = ensureTeamResources;
// src/services/guild.ts
const discord_js_1 = require("discord.js");
/**
 * Réutilise une catégorie par NOM si elle existe, sinon la crée.
 * (Pas de persistance DB -> évite l'erreur Prisma et les doublons)
 */
async function ensureLobbyCategoryPersist(guild, _lobbyId, // gardé pour compat signature, non utilisé
name) {
    // 1) tenter de retrouver une catégorie existante portant ce nom
    const found = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory && c.name === name);
    if (found)
        return found;
    // 2) sinon la créer
    const category = (await guild.channels.create({
        name,
        type: discord_js_1.ChannelType.GuildCategory,
    }));
    return category;
}
/** Crée (ou réutilise) rôle + text + voice pour une équipe sous une catégorie (idempotent). */
async function ensureTeamResources(guild, categoryId, teamName) {
    // Rôle
    const role = guild.roles.cache.find((r) => r.name === teamName) ??
        (await guild.roles.create({ name: teamName }));
    // Text
    let text = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildText &&
        c.parentId === categoryId &&
        c.name === teamName.toLowerCase().replace(/\s+/g, "-"));
    if (!text) {
        text = (await guild.channels.create({
            name: teamName,
            type: discord_js_1.ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites: [
                { id: guild.roles.everyone, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                { id: role.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ],
        }));
    }
    // Voice
    let voice = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildVoice &&
        c.parentId === categoryId &&
        c.name === teamName);
    if (!voice) {
        voice = (await guild.channels.create({
            name: teamName,
            type: discord_js_1.ChannelType.GuildVoice,
            parent: categoryId,
            permissionOverwrites: [
                { id: guild.roles.everyone, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                { id: role.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ],
        }));
    }
    return { roleId: role.id, textChannelId: text.id, voiceChannelId: voice.id };
}
