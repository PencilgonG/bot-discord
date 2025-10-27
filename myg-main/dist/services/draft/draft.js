"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const lolprodraft_js_1 = require("../../bot/draft/lolprodraft.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("draft")
    .setDescription("Créer une draft LoLProDraft avec liens auto")
    .addStringOption((opt) => opt
    .setName("blue")
    .setDescription("Nom de l'équipe bleue")
    .setRequired(true))
    .addStringOption((opt) => opt
    .setName("red")
    .setDescription("Nom de l'équipe rouge")
    .setRequired(true));
async function execute(interaction) {
    const blueName = interaction.options.getString("blue", true);
    const redName = interaction.options.getString("red", true);
    // Génère les 4 liens (Blue / Red / Spec / Stream)
    const links = (0, lolprodraft_js_1.createLolProDraftLinks)({ blueName, redName });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`Draft créée (${links.roomId})`)
        .setDescription("Voici les liens générés automatiquement :")
        .addFields({ name: "🔵 Blue", value: links.blue }, { name: "🔴 Red", value: links.red }, { name: "👀 Spectateur", value: links.spectate }, { name: "📺 Stream overlay", value: links.stream })
        .setColor(0x1d4ed8); // bleu Discord
    await interaction.reply({ embeds: [embed] });
}
