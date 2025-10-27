"use strict";
// src/bot/lobby/index.ts
// Pont unique vers le “wizard” du lobby.
// ⚠️ Ne surtout pas importer le dispatcher ici (sinon boucle d’import).
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLobbyModal = exports.handleLobbySelect = exports.onLobbyButton = exports.handleSlashLobby = void 0;
var wizard_js_1 = require("./wizard.js");
Object.defineProperty(exports, "handleSlashLobby", { enumerable: true, get: function () { return wizard_js_1.handleSlashLobby; } });
Object.defineProperty(exports, "onLobbyButton", { enumerable: true, get: function () { return wizard_js_1.onLobbyButton; } });
Object.defineProperty(exports, "handleLobbySelect", { enumerable: true, get: function () { return wizard_js_1.handleLobbySelect; } });
Object.defineProperty(exports, "handleLobbyModal", { enumerable: true, get: function () { return wizard_js_1.handleLobbyModal; } });
