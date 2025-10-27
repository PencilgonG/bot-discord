"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleName = exports.GameMode = void 0;
exports.rosterSizeFor = rosterSizeFor;
exports.modeLabel = modeLabel;
var GameMode;
(function (GameMode) {
    GameMode["SR_5v5"] = "SR_5v5";
    GameMode["SR_4v4"] = "SR_4v4";
    GameMode["SR_3v3"] = "SR_3v3";
    GameMode["SR_2v2"] = "SR_2v2";
})(GameMode || (exports.GameMode = GameMode = {}));
var RoleName;
(function (RoleName) {
    RoleName["TOP"] = "TOP";
    RoleName["JUNGLE"] = "JUNGLE";
    RoleName["MID"] = "MID";
    RoleName["ADC"] = "ADC";
    RoleName["SUPPORT"] = "SUPPORT";
    RoleName["FLEX"] = "FLEX";
})(RoleName || (exports.RoleName = RoleName = {}));
function rosterSizeFor(mode) {
    switch (mode) {
        case GameMode.SR_5v5: return 5;
        case GameMode.SR_4v4: return 4;
        case GameMode.SR_3v3: return 3;
        case GameMode.SR_2v2: return 2;
        default: return 5;
    }
}
function modeLabel(m) {
    return {
        [GameMode.SR_5v5]: '5v5',
        [GameMode.SR_4v4]: '4v4',
        [GameMode.SR_3v3]: '3v3',
        [GameMode.SR_2v2]: '2v2'
    }[m];
}
