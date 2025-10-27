"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDS = void 0;
// src/bot/interactions/ids.ts
exports.IDS = {
    // ===== Lobby wizard =====
    lobby: {
        // top-level wizard controls
        openConfig: (lobbyId) => `lobby:config:${lobbyId}`,
        testFill: (lobbyId) => `lobby:test:${lobbyId}`,
        validate: (lobbyId) => `lobby:validate:${lobbyId}`,
        // modals
        configModal: (lobbyId) => `modal:config:${lobbyId}`,
        scheduleModal: (lobbyId) => `modal:schedule:${lobbyId}`,
        // pick UI navigation
        pickPage: (lobbyId, teamNo) => `pick:page:${lobbyId}:${teamNo}`,
        pickPrev: (lobbyId, teamNo) => `pick:prev:${lobbyId}:${teamNo}`,
        pickNext: (lobbyId, teamNo) => `pick:next:${lobbyId}:${teamNo}`,
        pickValidate: (lobbyId) => `pick:validate:${lobbyId}`,
        pickSchedule: (lobbyId) => `pick:schedule:${lobbyId}`,
        // selects
        selectCaptain: (lobbyId, teamNo) => `select:captain:${lobbyId}:${teamNo}`,
        selectPlayers: (lobbyId, teamNo) => `select:players:${lobbyId}:${teamNo}`,
    },
    // ===== Match actions =====
    match: {
        validate: (matchId) => `match:validate:${matchId}`,
    },
    // ===== Draft actions =====
    draft: {
        remake: (matchId) => `draft:remake:${matchId}`,
    },
};
