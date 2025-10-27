// src/services/guild.ts
import {
  ChannelType,
  Guild,
  PermissionFlagsBits,
  type CategoryChannel,
  type TextChannel,
  type VoiceChannel,
} from "discord.js";

/**
 * Réutilise une catégorie par NOM si elle existe, sinon la crée.
 * (Pas de persistance DB -> évite l'erreur Prisma et les doublons)
 */
export async function ensureLobbyCategoryPersist(
  guild: Guild,
  _lobbyId: string,   // gardé pour compat signature, non utilisé
  name: string
): Promise<CategoryChannel> {
  // 1) tenter de retrouver une catégorie existante portant ce nom
  const found = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name
  ) as CategoryChannel | undefined;

  if (found) return found;

  // 2) sinon la créer
  const category = (await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
  })) as CategoryChannel;

  return category;
}

/** Crée (ou réutilise) rôle + text + voice pour une équipe sous une catégorie (idempotent). */
export async function ensureTeamResources(
  guild: Guild,
  categoryId: string,
  teamName: string
): Promise<{ roleId: string; textChannelId: string; voiceChannelId: string }> {
  // Rôle
  const role =
    guild.roles.cache.find((r) => r.name === teamName) ??
    (await guild.roles.create({ name: teamName }));

  // Text
  let text = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.parentId === categoryId &&
      c.name === teamName.toLowerCase().replace(/\s+/g, "-")
  ) as TextChannel | undefined;

  if (!text) {
    text = (await guild.channels.create({
      name: teamName,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: role.id, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    })) as TextChannel;
  }

  // Voice
  let voice = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildVoice &&
      c.parentId === categoryId &&
      c.name === teamName
  ) as VoiceChannel | undefined;

  if (!voice) {
    voice = (await guild.channels.create({
      name: teamName,
      type: ChannelType.GuildVoice,
      parent: categoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: role.id, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    })) as VoiceChannel;
  }

  return { roleId: role.id, textChannelId: text.id, voiceChannelId: voice.id };
}
