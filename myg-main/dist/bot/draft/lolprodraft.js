"use strict";
// src/services/lolprodraft.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLolProDraftLinks = createLolProDraftLinks;
/**
 * Génère des liens LoLProDraft stables sans Playwright, en reproduisant
 * exactement le format observé côté frontend :
 *
 *   base   = https://lolprodraft.com
 *   query  = ?ROOM_ID=<roomId>&blueName=<blue>&redName=<red>
 *   blue   = /draft/<roomId>/blue + query
 *   red    = /draft/<roomId>/red  + query
 *   spec   = /draft/<roomId>      + query
 *   stream = /draft/<roomId>/stream + query
 */
function createLolProDraftLinks(params) {
    const { blueName, redName } = params;
    // Room id court et lisible (même esprit que l’UI).
    const roomId = generateRoomId();
    const base = (params.baseUrl || "https://lolprodraft.com").replace(/\/+$/, "");
    const query = new URLSearchParams({
        ROOM_ID: roomId,
        blueName: blueName ?? "",
        redName: redName ?? "",
    }).toString();
    const spectate = `${base}/draft/${roomId}?${query}`;
    const blue = `${base}/draft/${roomId}/blue?${query}`;
    const red = `${base}/draft/${roomId}/red?${query}`;
    const stream = `${base}/draft/${roomId}/stream?${query}`;
    return { roomId, blue, red, spectate, stream };
}
/**
 * Génère un identifiant de room compact (6–8 chars alphanum).
 * Suffisant pour notre usage, comme observé dans l’app.
 */
function generateRoomId(length = 7) {
    // alphanum [a-z0-9], en minuscule
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * alphabet.length);
        out += alphabet[idx];
    }
    return out;
}
