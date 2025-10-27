// src/bot/interactions/register.ts
import { REST, Routes, APIApplicationCommandOptionChoice } from "discord.js";

/**
 * Enregistre UNIQUEMENT :
 *  - /lobby
 *  - /profil set
 *  - /profil view
 * et retire tout le reste (en écrasant le registre).
 */
export async function registerSlashCommands(
  appId: string,
  token: string,
  guildId?: string
) {
  const rest = new REST({ version: "10" }).setToken(token);

  const roleChoices: APIApplicationCommandOptionChoice<string>[] = [
    { name: "TOP", value: "TOP" },
    { name: "JUNGLE", value: "JUNGLE" },
    { name: "MID", value: "MID" },
    { name: "ADC", value: "ADC" },
    { name: "SUPPORT", value: "SUPPORT" },
    { name: "FLEX", value: "FLEX" },
  ];

  const commands = [
    {
      name: "lobby",
      description: "Créer et gérer un lobby d'inhouse",
      type: 1, // CHAT_INPUT
    },
    {
      name: "profil",
      description: "Gérer ton profil joueur",
      type: 1,
      options: [
        {
          name: "set",
          description: "Configurer / mettre à jour ton profil (opgg, dpm, etc.)",
          type: 1, // SUB_COMMAND
          options: [
            {
              name: "summoner",
              description: "Nom d'invocateur",
              type: 3, // STRING
              required: false,
            },
            {
              name: "opgg",
              description: "Lien OP.GG",
              type: 3,
              required: false,
            },
            {
              name: "region",
              description: "Région (ex: EUW, EUNE...)",
              type: 3,
              required: false,
            },
            {
              name: "role",
              description: "Rôle principal",
              type: 3,
              required: false,
              choices: roleChoices,
            },
            {
              name: "dpm",
              description: "Dégâts par minute estimés",
              type: 4, // INTEGER
              required: false,
            },
          ],
        },
        {
          name: "view",
          description: "Afficher un profil",
          type: 1, // SUB_COMMAND
          options: [
            {
              name: "user",
              description: "Utilisateur (optionnel, par défaut: toi)",
              type: 6, // USER
              required: false,
            },
          ],
        },
      ],
    },
  ];

  // —————————————————— Enregistrement ——————————————————
  if (guildId) {
    // Ecrase les commandes du serveur (supprime les anciennes)
    await rest.put(Routes.applicationGuildCommands(appId, guildId), {
      body: commands,
    });

    // Optionnel mais utile : vider les globales si tu avais déjà publié en global
    await rest.put(Routes.applicationCommands(appId), { body: [] }).catch(() => {});
    console.log(`🔧 Slash-commands (guild ${guildId}) mises à jour : /lobby, /profil`);
  } else {
    // Pas de GUILD_DEV_ID -> on écrit en global (et on écrase le reste)
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log(`🔧 Slash-commands (global) mises à jour : /lobby, /profil`);
  }
}
