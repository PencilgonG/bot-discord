"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSlashLobby = handleSlashLobby;
exports.onLobbyButton = onLobbyButton;
exports.handleLobbySelect = handleLobbySelect;
exports.handleLobbyModal = handleLobbyModal;
const discord_js_1 = require("discord.js");
const prisma_js_1 = require("../../infra/prisma.js");
const ids_js_1 = require("../interactions/ids.js");
const modals_js_1 = require("../../components/modals.js");
const embeds_js_1 = require("../../components/embeds.js");
const buttons_js_1 = require("../../components/buttons.js");
const selects_js_1 = require("../../components/selects.js");
const types_js_1 = require("../../domain/types.js");
const schedule_js_1 = require("./schedule.js");
const matches_js_1 = require("./matches.js");
const guild_js_1 = require("../../services/guild.js");
/* ───────────────────────────── helpers ───────────────────────────── */
function toGameMode(input) {
    const map = new Set(["SR_5v5", "SR_4v4", "SR_3v3", "SR_2v2"]);
    const key = (input || "SR_5v5").toUpperCase();
    return (map.has(key) ? key : "SR_5v5");
}
function lobbyEmbed(lobby) {
    return (0, embeds_js_1.baseEmbed)("Créer un lobby", "Configuration mise à jour. Clique sur **Valider** pour continuer.").addFields({ name: "Nom", value: lobby.name, inline: true }, { name: "Slots (équipes)", value: String(lobby.slots), inline: true }, { name: "Mode", value: (0, types_js_1.modeLabel)(lobby.mode), inline: true });
}
function controlsRow(lobbyId) {
    return (0, buttons_js_1.row)((0, buttons_js_1.btn)(ids_js_1.IDS.lobby.openConfig(lobbyId), "Configurer"), (0, buttons_js_1.btn)(ids_js_1.IDS.lobby.testFill(lobbyId), "Test (auto-fill)"), (0, buttons_js_1.btn)(ids_js_1.IDS.lobby.validate(lobbyId), "Valider", discord_js_1.ButtonStyle.Success));
}
async function acknowledgeAndEdit(interaction, payload) {
    try {
        await interaction.deferUpdate();
    }
    catch { }
    try {
        await interaction.message.edit(payload);
    }
    catch { }
}
// ───────────────────────── guard: orga only ─────────────────────────
async function requireOrganizer(interaction) {
    try {
        const member = interaction.guild?.members.cache.get(interaction.user.id) ??
            (await interaction.guild?.members.fetch(interaction.user.id).catch(() => null));
        const isWhitelisted = (process.env.ORGA_USER_IDS?.split(",") || []).map((s) => s.trim()).filter(Boolean)
            .includes(interaction.user.id);
        const hasRole = !!process.env.ORGA_ROLE_ID && !!member?.roles.cache.has(process.env.ORGA_ROLE_ID);
        if (isWhitelisted || hasRole)
            return true;
        await interaction.reply({
            content: "❌ Cette action est réservée aux **organisateurs**.",
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    catch {
        try {
            await interaction.reply({
                content: "❌ Impossible de vérifier tes permissions (orga only).",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        catch { }
        return false;
    }
}
// ───────────────────────── guard: lobby must exist ─────────────────────────
async function getLobbyOrWarn(interaction, lobbyId) {
    const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
    if (!lobby) {
        try {
            await interaction.reply({
                content: "❌ Ce lobby n’existe plus (supprimé ou expiré). Relance `/lobby`.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        catch { }
        return null;
    }
    return lobby;
}
// formateur d’une ligne joueur : "<@user> — [Summoner](opgg)"
function formatParticipantLine(p) {
    const who = `<@${p.userId}>`;
    const sum = p.profile?.summonerName && p.profile?.opggUrl
        ? `[${p.profile.summonerName}](${p.profile.opggUrl})`
        : p.profile?.summonerName ?? null;
    return sum ? `${who} — ${sum}` : who;
}
/* ─────────────────────── WAITING ROOM (signup) ─────────────────────── */
function waitingRoomButtons(lobbyId) {
    const r1 = (0, buttons_js_1.row)((0, buttons_js_1.btn)(`wait:join:role:${types_js_1.RoleName.TOP}:${lobbyId}`, "TOP"), (0, buttons_js_1.btn)(`wait:join:role:${types_js_1.RoleName.JUNGLE}:${lobbyId}`, "JUNGLE"), (0, buttons_js_1.btn)(`wait:join:role:${types_js_1.RoleName.MID}:${lobbyId}`, "MID"), (0, buttons_js_1.btn)(`wait:join:role:${types_js_1.RoleName.ADC}:${lobbyId}`, "ADC"), (0, buttons_js_1.btn)(`wait:join:role:${types_js_1.RoleName.SUPPORT}:${lobbyId}`, "SUPPORT"));
    const r2 = (0, buttons_js_1.row)((0, buttons_js_1.btn)(`wait:join:role:${types_js_1.RoleName.FLEX}:${lobbyId}`, "FLEX"), (0, buttons_js_1.btn)(`wait:join:sub:${lobbyId}`, "S’inscrire en SUB", discord_js_1.ButtonStyle.Secondary), (0, buttons_js_1.btn)(`wait:leave:${lobbyId}`, "Se désinscrire", discord_js_1.ButtonStyle.Danger), 
    // ⬇️ ce bouton ouvre directement le pick même si vous êtes 1 ou 2
    (0, buttons_js_1.btn)(`wait:pick:${lobbyId}`, "Pick teams", discord_js_1.ButtonStyle.Success));
    return [r1, r2];
}
async function renderWaitingRoomEmbed(lobbyId) {
    const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
    if (!lobby) {
        return (0, embeds_js_1.baseEmbed)("Salle d’attente", "⚠️ Lobby introuvable (supprimé).");
    }
    const participants = await prisma_js_1.prisma.lobbyParticipant.findMany({
        where: { lobbyId },
        include: { profile: true },
        orderBy: { userId: "asc" },
    });
    const byRole = {
        [types_js_1.RoleName.TOP]: [],
        [types_js_1.RoleName.JUNGLE]: [],
        [types_js_1.RoleName.MID]: [],
        [types_js_1.RoleName.ADC]: [],
        [types_js_1.RoleName.SUPPORT]: [],
        [types_js_1.RoleName.FLEX]: [],
    };
    const subs = [];
    for (const p of participants) {
        const line = formatParticipantLine(p);
        if (p.isSub)
            subs.push(line);
        else if (p.selectedRole)
            byRole[p.selectedRole].push(line);
    }
    const embed = (0, embeds_js_1.baseEmbed)(`Salle d’attente — ${lobby.name}`, "Inscrivez-vous par rôle ou en SUB. Vous pouvez vous désinscrire à tout moment. Quand prêt, cliquez **Pick teams**.")
        .addFields({ name: "TOP", value: byRole.TOP.join("\n") || "—", inline: true }, { name: "JUNGLE", value: byRole.JUNGLE.join("\n") || "—", inline: true }, { name: "MID", value: byRole.MID.join("\n") || "—", inline: true })
        .addFields({ name: "ADC", value: byRole.ADC.join("\n") || "—", inline: true }, { name: "SUPPORT", value: byRole.SUPPORT.join("\n") || "—", inline: true }, { name: "FLEX", value: byRole.FLEX.join("\n") || "—", inline: true })
        .addFields({
        name: "SUBS",
        value: subs.join("\n") || "—",
        inline: false,
    });
    return embed;
}
async function showWaitingRoom(interaction, lobbyId) {
    const embed = await renderWaitingRoomEmbed(lobbyId);
    const components = waitingRoomButtons(lobbyId);
    await acknowledgeAndEdit(interaction, { embeds: [embed], components });
}
async function signupForRole(userId, lobbyId, role) {
    await prisma_js_1.prisma.userProfile.upsert({
        where: { discordUserId: userId },
        create: { discordUserId: userId },
        update: {},
    });
    await prisma_js_1.prisma.lobbyParticipant.upsert({
        where: { lobbyId_userId: { lobbyId, userId } },
        create: { lobbyId, userId, selectedRole: role, isSub: false },
        update: { selectedRole: role, isSub: false },
    });
}
async function signupAsSub(userId, lobbyId) {
    await prisma_js_1.prisma.userProfile.upsert({
        where: { discordUserId: userId },
        create: { discordUserId: userId },
        update: {},
    });
    await prisma_js_1.prisma.lobbyParticipant.upsert({
        where: { lobbyId_userId: { lobbyId, userId } },
        create: { lobbyId, userId, isSub: true, selectedRole: null },
        update: { isSub: true, selectedRole: null },
    });
}
async function leaveWaitingRoom(userId, lobbyId) {
    await prisma_js_1.prisma.lobbyParticipant.deleteMany({ where: { lobbyId, userId } });
}
/* ─────────────────────────── slash / lobby ─────────────────────────── */
async function handleSlashLobby(interaction) {
    const name = "Inhouse Lobby";
    const slots = 2;
    const mode = toGameMode("SR_5v5");
    await interaction.reply({
        embeds: [lobbyEmbed({ name, slots, mode })],
        components: [controlsRow("temp")],
    });
    const msg = await interaction.fetchReply();
    const lobby = await prisma_js_1.prisma.lobby.create({
        data: {
            guildId: interaction.guildId,
            channelId: msg.channelId,
            messageId: msg.id,
            name,
            slots,
            mode,
            createdBy: interaction.user.id,
        },
    });
    await interaction.editReply({
        embeds: [lobbyEmbed(lobby)],
        components: [controlsRow(lobby.id)],
    });
}
/* ────────────────────────── button handlers ────────────────────────── */
async function onLobbyButton(interaction) {
    const id = interaction.customId;
    if (id.startsWith("lobby:config:")) {
        const lobbyId = id.split(":")[2];
        return interaction.showModal((0, modals_js_1.modalLobbyConfig)(ids_js_1.IDS.lobby.configModal(lobbyId)));
    }
    if (id.startsWith("lobby:test:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const lobbyId = id.split(":")[2];
        const lobby = await getLobbyOrWarn(interaction, lobbyId);
        if (!lobby)
            return;
        for (let i = 0; i < lobby.slots * 5; i++) {
            const uid = `${interaction.user.id}-${i + 1}`;
            await prisma_js_1.prisma.userProfile.upsert({
                where: { discordUserId: uid },
                create: { discordUserId: uid, summonerName: `Player${i + 1}` },
                update: {},
            });
            await prisma_js_1.prisma.lobbyParticipant.upsert({
                where: { lobbyId_userId: { lobbyId, userId: uid } },
                create: { lobbyId, userId: uid, selectedRole: types_js_1.RoleName.FLEX },
                update: {},
            });
        }
        try {
            await interaction.reply({
                content: "✅ Participants de test ajoutés. Passage au pick teams…",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        catch { }
        const payload = await buildPickPayload(lobbyId, 1);
        return interaction.message.edit(payload);
    }
    if (id.startsWith("lobby:validate:")) {
        const lobbyId = id.split(":")[2];
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return showWaitingRoom(interaction, lobbyId);
    }
    if (id.startsWith("pick:page:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const [, , lobbyId, teamNo] = id.split(":");
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return openPick(interaction, lobbyId, Number(teamNo));
    }
    if (id.startsWith("pick:prev:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const [, , lobbyId, teamNo] = id.split(":");
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return openPick(interaction, lobbyId, Math.max(1, Number(teamNo) - 1));
    }
    if (id.startsWith("pick:next:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const [, , lobbyId, teamNo] = id.split(":");
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return openPick(interaction, lobbyId, Number(teamNo) + 1);
    }
    if (id.startsWith("pick:validate:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const lobbyId = id.split(":")[2];
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return validateTeams(interaction, lobbyId);
    }
    if (id.startsWith("pick:schedule:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const lobbyId = id.split(":")[2];
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return showPlanningPicker(interaction, lobbyId);
    }
    if (id.startsWith("wait:join:role:")) {
        const [, , , roleStr, lobbyId] = id.split(":");
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        const role = roleStr;
        await signupForRole(interaction.user.id, lobbyId, role);
        const embed = await renderWaitingRoomEmbed(lobbyId);
        const components = waitingRoomButtons(lobbyId);
        try {
            await interaction.deferUpdate();
        }
        catch { }
        return interaction.message.edit({ embeds: [embed], components });
    }
    if (id.startsWith("wait:join:sub:")) {
        const lobbyId = id.split(":")[3];
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        await signupAsSub(interaction.user.id, lobbyId);
        const embed = await renderWaitingRoomEmbed(lobbyId);
        const components = waitingRoomButtons(lobbyId);
        try {
            await interaction.deferUpdate();
        }
        catch { }
        return interaction.message.edit({ embeds: [embed], components });
    }
    if (id.startsWith("wait:leave:")) {
        const lobbyId = id.split(":")[2];
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        await leaveWaitingRoom(interaction.user.id, lobbyId);
        const embed = await renderWaitingRoomEmbed(lobbyId);
        const components = waitingRoomButtons(lobbyId);
        try {
            await interaction.deferUpdate();
        }
        catch { }
        return interaction.message.edit({ embeds: [embed], components });
    }
    if (id.startsWith("wait:pick:")) {
        if (!(await requireOrganizer(interaction)))
            return;
        const lobbyId = id.split(":")[2];
        if (!(await getLobbyOrWarn(interaction, lobbyId)))
            return;
        return openPick(interaction, lobbyId, 1);
    }
    if (id.startsWith("match:validate:")) {
        return (0, matches_js_1.onMatchValidated)(interaction, id.split(":")[2]);
    }
    if (id.startsWith("draft:remake:")) {
        return (0, matches_js_1.onDraftRemakeButton)(interaction, id.split(":")[2]);
    }
}
/* ───────────────────────── select handlers ───────────────────────── */
async function handleLobbySelect(interaction) {
    const id = interaction.customId;
    if (id.startsWith("select:captain:")) {
        const [, , lobbyId, teamNo] = id.split(":");
        const userId = interaction.values[0];
        const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby) {
            return interaction.update({ content: "⚠️ Lobby supprimé.", components: [], embeds: [] });
        }
        await prisma_js_1.prisma.lobbyParticipant.updateMany({
            where: { lobbyId, teamNumber: Number(teamNo), isCaptain: true },
            data: { isCaptain: false },
        });
        await prisma_js_1.prisma.lobbyParticipant.updateMany({
            where: { lobbyId, userId },
            data: { teamNumber: Number(teamNo), isCaptain: true },
        });
        await interaction.update({
            content: `✅ Capitaine pour l'équipe ${teamNo} : <@${userId}>`,
            components: [],
            embeds: [],
        });
        const payload = await buildPickPayload(lobbyId, Number(teamNo));
        return interaction.message.edit(payload);
    }
    if (id.startsWith("select:players:")) {
        const [, , lobbyId, teamNo] = id.split(":");
        const members = interaction.values;
        const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby) {
            return interaction.update({ content: "⚠️ Lobby supprimé.", components: [], embeds: [] });
        }
        await prisma_js_1.prisma.lobbyParticipant.updateMany({
            where: { lobbyId, teamNumber: Number(teamNo) },
            data: { teamNumber: null },
        });
        for (const userId of members) {
            await prisma_js_1.prisma.lobbyParticipant.updateMany({
                where: { lobbyId, userId },
                data: { teamNumber: Number(teamNo) },
            });
        }
        await interaction.update({
            content: `✅ Joueurs affectés à l'équipe ${teamNo}.`,
            components: [],
            embeds: [],
        });
        const payload = await buildPickPayload(lobbyId, Number(teamNo));
        return interaction.message.edit(payload);
    }
    if (id.startsWith("select:planning:")) {
        const lobbyId = id.split(":")[2];
        const choice = interaction.values[0];
        const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby) {
            return interaction.update({ content: "⚠️ Lobby supprimé.", components: [], embeds: [] });
        }
        const schedule = buildScheduleFromChoice(lobby.slots, choice);
        await prisma_js_1.prisma.match.deleteMany({ where: { lobbyId } });
        for (let r = 0; r < schedule.length; r++) {
            for (let i = 0; i < schedule[r].length; i++) {
                const { a, b } = schedule[r][i];
                const blueTeam = await prisma_js_1.prisma.team.upsert({
                    where: { lobbyId_number: { lobbyId, number: a } },
                    create: { lobbyId, number: a, name: `Équipe ${a}` },
                    update: {},
                });
                const redTeam = await prisma_js_1.prisma.team.upsert({
                    where: { lobbyId_number: { lobbyId, number: b } },
                    create: { lobbyId, number: b, name: `Équipe ${b}` },
                    update: {},
                });
                await prisma_js_1.prisma.match.create({
                    data: {
                        lobbyId,
                        round: r,
                        indexInRound: i,
                        blueTeamId: blueTeam.id,
                        redTeamId: redTeam.id,
                    },
                });
            }
        }
        await interaction.update({
            content: "✅ Planning généré. Clique **Valider** pour créer rôles/salons et envoyer la manche 1.",
            components: [],
            embeds: [],
        });
    }
}
/* ───────────────────────── modal handlers ───────────────────────── */
async function handleLobbyModal(interaction) {
    const id = interaction.customId;
    if (id.startsWith("modal:schedule:")) {
        const lobbyId = id.split(":")[2];
        const format = interaction.fields.getTextInputValue("format");
        const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby) {
            return interaction.reply({
                content: "❌ Lobby supprimé.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        const schedule = (0, schedule_js_1.parseScheduleFormat)(format, lobby.slots);
        if (!schedule.length)
            return interaction.reply({
                content: "❌ Format invalide.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        await prisma_js_1.prisma.match.deleteMany({ where: { lobbyId } });
        for (let r = 0; r < schedule.length; r++) {
            for (let i = 0; i < schedule[r].length; i++) {
                const { a, b } = schedule[r][i];
                const blueTeam = await prisma_js_1.prisma.team.upsert({
                    where: { lobbyId_number: { lobbyId, number: a } },
                    create: { lobbyId, number: a, name: `Équipe ${a}` },
                    update: {},
                });
                const redTeam = await prisma_js_1.prisma.team.upsert({
                    where: { lobbyId_number: { lobbyId, number: b } },
                    create: { lobbyId, number: b, name: `Équipe ${b}` },
                    update: {},
                });
                await prisma_js_1.prisma.match.create({
                    data: {
                        lobbyId,
                        round: r,
                        indexInRound: i,
                        blueTeamId: blueTeam.id,
                        redTeamId: redTeam.id,
                    },
                });
            }
        }
        return interaction.reply({
            content: "✅ Planning enregistré. Clique **Valider** pour créer rôles/salons et envoyer la manche 1.",
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
    if (id.startsWith("modal:config:")) {
        const lobbyId = id.split(":")[2];
        const name = interaction.fields.getTextInputValue("name");
        const slots = Number(interaction.fields.getTextInputValue("slots") || "2");
        const mode = toGameMode(interaction.fields.getTextInputValue("mode"));
        const lobby = await prisma_js_1.prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby) {
            return interaction.reply({
                content: "❌ Lobby supprimé.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        await prisma_js_1.prisma.lobby.update({
            where: { id: lobbyId },
            data: { name, slots, mode },
        });
        const ch = (await interaction.client.channels
            .fetch(lobby.channelId)
            .catch(() => null));
        if (ch?.isTextBased?.()) {
            const msg = await ch.messages.fetch(lobby.messageId).catch(() => null);
            if (msg)
                await msg.edit({
                    embeds: [lobbyEmbed({ name, slots, mode })],
                    components: [controlsRow(lobbyId)],
                });
        }
        try {
            await interaction.reply({
                content: "⚙️ Config mise à jour.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        catch { }
        return;
    }
    return interaction.reply({
        content: "❌ Modal inconnue.",
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
}
/* ───────────────────────────── pick flow ───────────────────────────── */
async function buildPickPayload(lobbyId, teamNo) {
    const lobby = await prisma_js_1.prisma.lobby.findUniqueOrThrow({ where: { id: lobbyId } });
    for (let i = 1; i <= lobby.slots; i++) {
        await prisma_js_1.prisma.team.upsert({
            where: { lobbyId_number: { lobbyId, number: i } },
            create: { lobbyId, number: i, name: `Équipe ${i}` },
            update: {},
        });
    }
    const team = await prisma_js_1.prisma.team.findUniqueOrThrow({
        where: { lobbyId_number: { lobbyId, number: teamNo } },
    });
    const participants = await prisma_js_1.prisma.lobbyParticipant.findMany({
        where: { lobbyId },
        include: { profile: true },
        orderBy: { userId: "asc" },
    });
    const rosterSize = (0, types_js_1.rosterSizeFor)(lobby.mode);
    const currentMembers = participants.filter((p) => p.teamNumber === teamNo);
    const captain = currentMembers.find((p) => p.isCaptain);
    const rosterCount = currentMembers.length;
    const rosterList = currentMembers.length
        ? currentMembers.map((o) => `<@${o.userId}>`).join(" ")
        : "—";
    const embed = (0, embeds_js_1.baseEmbed)(`Pick équipes — ${team.name}`)
        .addFields({ name: "Équipe", value: `${team.number}/${lobby.slots}`, inline: true }, {
        name: "Capitaine",
        value: captain ? `<@${captain.userId}>` : "—",
        inline: true,
    }, {
        name: `Joueurs (${rosterCount}/${rosterSize})`,
        value: rosterList,
        inline: false,
    })
        .setDescription("Sélectionne le **capitaine** puis les **joueurs** (le capitaine doit aussi être dans les joueurs). Utilise *Suivant/Précédent* pour changer d’équipe.");
    const allOptions = participants.map((p) => ({
        label: p.profile?.summonerName || p.userId,
        value: p.userId,
    }));
    const menus = [
        (0, selects_js_1.selectMenu)(ids_js_1.IDS.lobby.selectCaptain(lobbyId, teamNo), "Capitaine", allOptions, 1, 1),
        (0, selects_js_1.selectMenu)(ids_js_1.IDS.lobby.selectPlayers(lobbyId, teamNo), `Joueurs (${rosterCount}/${rosterSize})`, allOptions, 1, rosterSize),
    ];
    const navRow = (0, buttons_js_1.row)((0, buttons_js_1.btn)(ids_js_1.IDS.lobby.pickPrev(lobbyId, teamNo), "← Précédent"), (0, buttons_js_1.btn)(ids_js_1.IDS.lobby.pickNext(lobbyId, teamNo), "Suivant →"));
    const actionsRow = (0, buttons_js_1.row)((0, buttons_js_1.btn)(ids_js_1.IDS.lobby.pickSchedule(lobbyId), "Planning des matchs"), (0, buttons_js_1.btn)(ids_js_1.IDS.lobby.pickValidate(lobbyId), "Valider", discord_js_1.ButtonStyle.Success));
    return { embeds: [embed], components: [...menus, navRow, actionsRow] };
}
async function openPick(interaction, lobbyId, teamNo) {
    const lobby = await prisma_js_1.prisma.lobby.findUniqueOrThrow({ where: { id: lobbyId } });
    const t = Math.min(Math.max(1, teamNo), lobby.slots);
    const payload = await buildPickPayload(lobbyId, t);
    return acknowledgeAndEdit(interaction, payload);
}
/* ─────────────── Planning picker (menu) + génération ─────────────── */
function showPlanningPicker(inter, lobbyId) {
    return inter.reply({
        content: "🗓️ Choisis un planning :",
        components: [
            (0, selects_js_1.selectMenu)(`select:planning:${lobbyId}`, "Sélectionne un planning", [
                { label: "2 équipes — Bo1", value: "2:bo1" },
                { label: "2 équipes — Bo3", value: "2:bo3" },
                { label: "2 équipes — Bo5", value: "2:bo5" },
                { label: "4 équipes — 1 round (random)", value: "4:1" },
                { label: "4 équipes — 2 rounds (random)", value: "4:2" },
                { label: "4 équipes — 3 rounds (round robin)", value: "4:3" },
            ], 1, 1),
        ],
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
}
function shuffleInPlace(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [a[i], a[j]] = [a[j], a[i]];
    }
}
function buildScheduleFromChoice(slots, choice) {
    if (slots === 2) {
        const count = choice.endsWith("bo5") ? 5 : choice.endsWith("bo3") ? 3 : 1;
        return Array.from({ length: count }, () => [{ a: 1, b: 2 }]);
    }
    const rr = [
        [
            { a: 1, b: 2 },
            { a: 3, b: 4 },
        ],
        [
            { a: 1, b: 3 },
            { a: 2, b: 4 },
        ],
        [
            { a: 1, b: 4 },
            { a: 2, b: 3 },
        ],
    ];
    const ask = Number(choice.split(":")[1] || "3");
    if (ask >= 3)
        return rr;
    const copy = rr.slice();
    shuffleInPlace(copy);
    return copy.slice(0, Math.max(1, Math.min(ask, 3)));
}
/* ────────────────────── validation & round 1 send ───────────────────── */
// ────────────────────── validation & round 1 send ─────────────────────
async function validateTeams(interaction, lobbyId) {
    // Aucune vérification de quota ici : on valide quoi qu'il arrive
    const lobby = await prisma_js_1.prisma.lobby.findUniqueOrThrow({ where: { id: lobbyId } });
    // Crée/assure la catégorie de lobby
    // AVANT
    // const category = await ensureLobbyCategory(interaction.guild!, `${lobby.name}`);
    // APRÈS
    const category = await (0, guild_js_1.ensureLobbyCategoryPersist)(interaction.guild, lobby.id, lobby.name);
    // Pour chaque équipe existante dans la DB, on s'assure du rôle + salons
    for (let n = 1; n <= lobby.slots; n++) {
        const team = await prisma_js_1.prisma.team.findUniqueOrThrow({
            where: { lobbyId_number: { lobbyId, number: n } },
        });
        // Si déjà câblé ET toujours existant sur Discord → on saute
        const hasAll = team.roleId && team.textChannelId && team.voiceChannelId;
        if (hasAll) {
            const [roleOk, textOk, voiceOk] = await Promise.all([
                interaction.guild.roles.fetch(team.roleId).then(Boolean).catch(() => false),
                interaction.guild.channels.fetch(team.textChannelId).then(Boolean).catch(() => false),
                interaction.guild.channels.fetch(team.voiceChannelId).then(Boolean).catch(() => false),
            ]);
            if (roleOk && textOk && voiceOk)
                continue;
        }
        const res = await (0, guild_js_1.ensureTeamResources)(interaction.guild, category.id, team.name);
        await prisma_js_1.prisma.team.update({
            where: { id: team.id },
            data: {
                roleId: res.roleId,
                textChannelId: res.textChannelId,
                voiceChannelId: res.voiceChannelId,
            },
        });
    }
    // S'il n'y a pas encore de matchs du round 0 définis → demander le planning
    const matchesCount = await prisma_js_1.prisma.match.count({
        where: { lobbyId, round: 0 },
    });
    if (matchesCount === 0) {
        return interaction.reply({
            content: "✅ Équipes validées. Clique **Planning des matchs** pour définir le planning.",
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
    // Sinon : on envoie les premiers matchs + lineup et on passe l'état en RUNNING
    await interaction.message.edit({
        content: "✅ Équipes validées, envoi des **premiers matchs** dans les salons. Les capitaines cliqueront **Valider** à la fin.",
        embeds: [],
        components: [],
    }).catch(() => { });
    await (0, matches_js_1.sendRoundMatches)(interaction.guild, lobbyId, 0, lobby.channelId);
    await (0, matches_js_1.postLineupSummary)(interaction.guild, lobbyId, lobby.channelId);
    await prisma_js_1.prisma.lobby.update({
        where: { id: lobbyId },
        data: { state: "RUNNING", currentRound: 0 },
    });
}
