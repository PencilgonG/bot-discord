"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectMenu = selectMenu;
const discord_js_1 = require("discord.js");
function selectMenu(customId, placeholder, options, min = 1, max = 1) {
    const menu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(min)
        .setMaxValues(max)
        .addOptions(options.map(o => ({ label: o.label, value: o.value })));
    return new discord_js_1.ActionRowBuilder().addComponents(menu);
}
