"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modalLobbyConfig = modalLobbyConfig;
exports.modalSchedule = modalSchedule;
const discord_js_1 = require("discord.js");
function modalLobbyConfig(customId) {
    const modal = new discord_js_1.ModalBuilder().setCustomId(customId).setTitle('Configurer le lobby');
    const name = new discord_js_1.TextInputBuilder()
        .setCustomId('name')
        .setLabel('Nom du lobby')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const slots = new discord_js_1.TextInputBuilder()
        .setCustomId('slots')
        .setLabel('Nombre d’équipes')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('2-8');
    const mode = new discord_js_1.TextInputBuilder()
        .setCustomId('mode')
        .setLabel('Mode (SR_5v5, SR_4v4, SR_3v3, SR_2v2)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('SR_5v5');
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(name), new discord_js_1.ActionRowBuilder().addComponents(slots), new discord_js_1.ActionRowBuilder().addComponents(mode));
    return modal;
}
function modalSchedule(customId) {
    const modal = new discord_js_1.ModalBuilder().setCustomId(customId).setTitle('Planning des matchs');
    const format = new discord_js_1.TextInputBuilder()
        .setCustomId('format')
        .setLabel('Format (ex: 1-2,3-4 | 1-3,2-4)')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(format));
    return modal;
}
