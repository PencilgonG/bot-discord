"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseEmbed = baseEmbed;
const discord_js_1 = require("discord.js");
const color = 0x5865F2;
const logo = process.env.LOGO_URL;
const banner = process.env.BANNER_URL;
function baseEmbed(title, description) {
    const e = new discord_js_1.EmbedBuilder().setColor(color).setTitle(title);
    if (description)
        e.setDescription(description);
    if (logo)
        e.setThumbnail(logo);
    if (banner)
        e.setImage(banner);
    return e;
}
