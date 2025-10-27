"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLobbyModal = exports.handleLobbySelect = exports.onLobbyButton = void 0;
exports.handleSlash = handleSlash;
// Flux lobby (slash / boutons / selects / modals)
const wizard_1 = require("../../lobby/wizard");
Object.defineProperty(exports, "onLobbyButton", { enumerable: true, get: function () { return wizard_1.onLobbyButton; } });
Object.defineProperty(exports, "handleLobbySelect", { enumerable: true, get: function () { return wizard_1.handleLobbySelect; } });
Object.defineProperty(exports, "handleLobbyModal", { enumerable: true, get: function () { return wizard_1.handleLobbyModal; } });
// Profil (/profil set, /profil view)
const set_1 = require("../profile/set");
const view_1 = require("../profile/view");
/**
 * Routeur des commandes slash.
 * On garde tout centralisé ici pour que l’interactions/dispatcher
 * n’ait qu’à déléguer à handleSlash().
 */
async function handleSlash(interaction) {
    if (!interaction.isChatInputCommand())
        return;
    // /lobby
    if (interaction.commandName === "lobby") {
        return (0, wizard_1.handleSlashLobby)(interaction);
    }
    // /profil set | view
    if (interaction.commandName === "profil") {
        const sub = interaction.options.getSubcommand();
        if (sub === "set")
            return (0, set_1.handleProfileSet)(interaction);
        if (sub === "view")
            return (0, view_1.handleProfileView)(interaction);
    }
}
