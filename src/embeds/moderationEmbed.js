// src/embeds/moderationEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

function buildModEmbed(action, moderator, target, reason, extra = {}) {
  const actionColors = {
    ban: COLORS.DANGER,
    tempban: COLORS.DANGER,
    tempban_expire: COLORS.SUCCESS,
    softban: COLORS.DANGER,
    kick: COLORS.DEEP,
    tempkick: COLORS.DEEP,
    tempkick_expire: COLORS.SUCCESS,
    mute: COLORS.DEEP,
    timeout: COLORS.DEEP,
    warn: COLORS.SECONDARY,
    unmute: COLORS.SUCCESS,
    unban: COLORS.SUCCESS,
    lock: COLORS.DEEP,
    unlock: COLORS.SUCCESS,
    purge: COLORS.SECONDARY,
    nick: COLORS.LIGHT,
    slowmode: COLORS.LIGHT,
  };
  const actionEmojis = {
    ban: '🔨',
    tempban: '⏰🔨',
    tempban_expire: '✅',
    softban: '🔨',
    kick: '👢',
    tempkick: '⏰👢',
    tempkick_expire: '✅',
    mute: '🔇',
    timeout: '⏰',
    warn: '⚠️',
    unmute: '🔊',
    unban: '🔓',
    lock: '🔒',
    unlock: '🔓',
    purge: '🗑️',
    nick: '📝',
    slowmode: '🐌',
  };
  const actionLabels = {
    ban: 'Bannissement',
    tempban: 'Ban Temporaire',
    tempban_expire: 'Ban Temporaire Expiré',
    softban: 'Soft-ban',
    kick: 'Expulsion',
    tempkick: 'Expulsion Temporaire',
    tempkick_expire: 'Expulsion Temporaire Expirée',
    mute: 'Muet',
    timeout: 'Timeout',
    warn: 'Avertissement',
    unmute: 'Démutage',
    unban: 'Dé-bannissement',
    lock: 'Verrouillage',
    unlock: 'Déverrouillage',
    purge: 'Purge',
    nick: 'Surnom modifié',
    slowmode: 'Slowmode',
  };

  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const embed = new EmbedBuilder()
    .setColor(actionColors[action] || COLORS.PRIMARY)
    .setTitle(`${actionEmojis[action] || EMOJIS.MODERATION} ${actionLabels[action] || action}`)
    .setThumbnail(target?.displayAvatarURL?.({ dynamic: true }) ?? null)
    .addFields(
      { name: '👤 Membre', value: target ? `${target.tag || target.user?.tag || 'Inconnu'} (${target.id})` : 'Inconnu', inline: true },
      { name: '🛡️ Modérateur', value: `${moderator.tag || moderator.user?.tag || 'Système'} (${moderator.id})`, inline: true },
      { name: '📝 Raison', value: reason || 'Aucune raison fournie', inline: false },
    )
    .setFooter({ text: `⚔️ WestSky • ${date}` })
    .setTimestamp();

  if (extra.duration) embed.addFields({ name: '⏱️ Durée', value: extra.duration, inline: true });
  if (extra.expiresAt) embed.addFields({ name: '📅 Expiration', value: extra.expiresAt, inline: true });
  if (extra.count) embed.addFields({ name: '🗑️ Messages supprimés', value: `${extra.count}`, inline: true });

  return embed;
}

const SANCTION_DM = {
  ban:     { emoji: '🔨', label: 'Tu as été banni' },
  softban: { emoji: '🔨', label: 'Tu as été softban (messages purgés)' },
  tempban: { emoji: '⏰🔨', label: 'Tu as été banni temporairement' },
  kick:    { emoji: '👢', label: 'Tu as été expulsé' },
  tempkick:{ emoji: '⏰👢', label: 'Tu as été expulsé temporairement' },
  mute:    { emoji: '🔇', label: 'Tu as été rendu muet' },
  timeout: { emoji: '⏰', label: 'Tu as été mis en timeout' },
  warn:    { emoji: '⚠️', label: 'Tu as reçu un avertissement' },
};

/**
 * Embed envoyé en DM au membre sanctionné.
 * extra: { duration, warnCount }
 */
function buildSanctionDM(action, guild, reason, moderator, extra = {}) {
  const info = SANCTION_DM[action] || { emoji: '🛡️', label: 'Tu as été sanctionné' };
  const embed = new EmbedBuilder()
    .setColor(COLORS.DANGER)
    .setTitle(`${info.emoji} ${info.label}`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .addFields(
      { name: '🏰 Serveur', value: guild.name, inline: true },
      { name: '🛡️ Modérateur', value: moderator?.tag || moderator?.user?.tag || 'Staff', inline: true },
      { name: '📝 Raison', value: reason || 'Aucune raison fournie', inline: false },
    )
    .setFooter({ text: `⚔️ WestSky • ${guild.name}` })
    .setTimestamp();

  if (extra.duration) embed.addFields({ name: '⏱️ Durée', value: extra.duration, inline: true });
  if (extra.warnCount) embed.addFields({ name: '⚠️ Total avertissements', value: `${extra.warnCount}`, inline: true });

  return embed;
}

module.exports = { buildModEmbed, buildSanctionDM };
