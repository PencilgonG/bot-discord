"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfileSet = handleProfileSet;
const discord_js_1 = require("discord.js");
const prisma_js_1 = require("../../../infra/prisma.js");
const embeds_js_1 = require("../../../components/embeds.js");
const types_js_1 = require("../../../domain/types.js");
// Regions alignées sur l'enum Prisma LoLRegion (valeurs UPPERCASE)
const REGION_CHOICES = [
    "EUW",
    "EUNE",
    "NA",
    "KR",
    "JP",
    "OCE",
    "BR",
    "LAN",
    "LAS",
    "TR",
    "RU",
];
function parseMainRole(input) {
    if (!input)
        return undefined;
    const k = input.toUpperCase();
    // On accepte TOP/JUNGLE/MID/ADC/SUPPORT/FLEX
    if (types_js_1.RoleName[k])
        return k;
    return undefined;
}
async function handleProfileSet(interaction) {
    // champs attendus :
    // summoner: string (Nom#Tag)
    // opgg: string (url) - optionnel
    // dpm: string (url) - optionnel
    // mainrole: string (enum RoleName) - optionnel
    // region: string (enum LoLRegion) - optionnel  👈 NOUVEAU
    const summoner = interaction.options.getString("summoner")?.trim() || null;
    const opgg = interaction.options.getString("opgg")?.trim() || null;
    const dpm = interaction.options.getString("dpm")?.trim() || null;
    const mainRoleRaw = interaction.options.getString("mainrole");
    const regionRaw = interaction.options.getString("region");
    const mainRole = parseMainRole(mainRoleRaw) || null;
    let region = null;
    if (regionRaw) {
        const up = regionRaw.toUpperCase();
        if (REGION_CHOICES.includes(up)) {
            region = up;
        }
    }
    await prisma_js_1.prisma.userProfile.upsert({
        where: { discordUserId: interaction.user.id },
        create: {
            discordUserId: interaction.user.id,
            summonerName: summoner,
            opggUrl: opgg,
            dpmUrl: dpm,
            preferredRoles: mainRole ? [mainRole] : [],
            region: region ?? undefined,
        },
        update: {
            summonerName: summoner ?? undefined,
            opggUrl: opgg ?? undefined,
            dpmUrl: dpm ?? undefined,
            preferredRoles: mainRole ? [mainRole] : [],
            region: region ?? undefined,
        },
    });
    const embed = (0, embeds_js_1.baseEmbed)("Profil mis à jour").addFields({ name: "Summoner", value: summoner || "—", inline: true }, { name: "Rôle principal", value: mainRole ?? "—", inline: true }, { name: "Région", value: region ?? "—", inline: true }, { name: "OP.GG", value: opgg || "—", inline: false }, { name: "DPM", value: dpm || "—", inline: false });
    await interaction.reply({
        embeds: [embed],
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
}
