"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLolProDraftLinks = createLolProDraftLinks;
function generateRoomId() {
    // ID court, lisible, suffisant pour lolprodraft
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let id = "";
    for (let i = 0; i < 8; i++)
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    return id;
}
async function createLolProDraftLinks(blueName, redName, matchName) {
    // matchName n'est pas requis par lolprodraft pour créer les liens, on l’ignore ici.
    const ROOM_ID = generateRoomId();
    const enc = encodeURIComponent;
    const q = `?ROOM_ID=${ROOM_ID}&blueName=${enc(blueName)}&redName=${enc(redName)}`;
    const base = `https://lolprodraft.com/draft/${ROOM_ID}`;
    return {
        blue: `${base}/blue${q}`,
        red: `${base}/red${q}`,
        spec: `${base}${q}`,
        stream: `${base}/stream${q}`,
    };
}
