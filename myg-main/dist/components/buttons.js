"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.btn = btn;
exports.row = row;
const discord_js_1 = require("discord.js");
/** Crée un bouton */
function btn(customId, label, style = discord_js_1.ButtonStyle.Primary) {
    return new discord_js_1.ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(style);
}
/** Crée une row qui contient un ou plusieurs boutons */
function row(...components) {
    return new discord_js_1.ActionRowBuilder().addComponents(components);
}
