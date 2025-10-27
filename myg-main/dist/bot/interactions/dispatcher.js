"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSlash = handleSlash;
exports.handleButton = handleButton;
exports.handleSelect = handleSelect;
exports.handleModal = handleModal;
exports.handleInteractionComponent = handleInteractionComponent;
// === LOBBY (wizard) ===
const index_js_1 = require("../lobby/index.js");
// === PROFIL (/profil set | /profil view) ===
const set_js_1 = require("../commands/profile/set.js");
const view_js_1 = require("../commands/profile/view.js");
/**
 * Route les slash commands
 */
async function handleSlash(interaction) {
    const name = interaction.commandName;
    // /lobby
    if (name === "lobby") {
        return (0, index_js_1.handleSlashLobby)(interaction);
    }
    // /profil set | /profil view
    if (name === "profil") {
        const sub = interaction.options.getSubcommand();
        if (sub === "set")
            return (0, set_js_1.handleProfileSet)(interaction);
        if (sub === "view")
            return (0, view_js_1.handleProfileView)(interaction);
    }
    // non géré → no-op
    return;
}
/**
 * Route UNIQUEMENT les boutons
 * (exposé séparément si ton index.ts en a besoin quelque part)
 */
async function handleButton(interaction) {
    return (0, index_js_1.onLobbyButton)(interaction);
}
/**
 * Route UNIQUEMENT les selects (StringSelectMenu)
 */
async function handleSelect(interaction) {
    return (0, index_js_1.handleLobbySelect)(interaction);
}
/**
 * Route UNIQUEMENT les modals
 */
async function handleModal(interaction) {
    return (0, index_js_1.handleLobbyModal)(interaction);
}
/**
 * ⭐ Compatibilité avec ton src/index.ts
 * Ton bootstrap appelle `handleInteractionComponent` pour tout ce qui n’est pas une slash command.
 * On route ici selon le type d’interaction (button/select/modal).
 */
async function handleInteractionComponent(interaction) {
    if (interaction.isButton()) {
        return (0, index_js_1.onLobbyButton)(interaction);
    }
    if (interaction.isStringSelectMenu()) {
        return (0, index_js_1.handleLobbySelect)(interaction);
    }
    if (interaction.isModalSubmit()) {
        return (0, index_js_1.handleLobbyModal)(interaction);
    }
    // Autres types non gérés → no-op
    return;
}
