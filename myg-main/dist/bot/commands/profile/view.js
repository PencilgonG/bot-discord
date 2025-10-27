"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfileView = handleProfileView;
const discord_js_1 = require("discord.js");
const prisma_js_1 = require("../../../infra/prisma.js");
const embeds_js_1 = require("../../../components/embeds.js");
/**
 * Affiche le profil d'un utilisateur (profil LoL, rôle, région, etc.)
 */
async function handleProfileView(interaction) {
    try {
        // ✅ Étape 1 : on accuse réception immédiatement
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        // ✅ Étape 2 : on récupère l’utilisateur ciblé (ou celui qui tape la commande)
        const user = interaction.options.getUser("user") ?? interaction.user;
        // ✅ Étape 3 : on tente de récupérer son profil depuis Prisma
        const profile = await prisma_js_1.prisma.userProfile.findUnique({
            where: { discordUserId: user.id },
        });
        // ✅ Étape 4 : création de l’embed (avec fallback si profil absent)
        const embed = (0, embeds_js_1.baseEmbed)(`Profil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ size: 128 }))
            .addFields({ name: "Summoner", value: profile?.summonerName ?? "—", inline: true }, { name: "Rôle principal", value: profile?.preferredRoles?.join(", ") ?? "—", inline: true }, { name: "Région", value: profile?.region ?? "—", inline: true }, { name: "OP.GG", value: profile?.opggUrl ?? "—", inline: false }, { name: "DPM", value: profile?.dpmUrl ?? "—", inline: false });
        // ✅ Étape 5 : réponse finale
        await interaction.editReply({ embeds: [embed] });
    }
    catch (err) {
        console.error("Erreur dans handleProfileView:", err);
        // Si l'interaction a déjà expiré, on évite le crash
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                content: "❌ Une erreur est survenue lors de la récupération du profil.",
            });
        }
        else {
            await interaction.reply({
                content: "❌ Une erreur est survenue lors de la récupération du profil.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
    }
}
