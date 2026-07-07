// src/services/moderationService.js
const prisma = require('../database/prisma');
const { buildModEmbed } = require('../embeds/moderationEmbed');

/**
 * Envoie un embed de modération dans le salon de logs configuré.
 * Centralise le motif "fetch config → fetch channel → send" dupliqué dans les commandes.
 */
async function sendModLog(guild, action, moderator, target, reason, extra = {}) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
    if (!config?.logChannelId) return;
    const logCh = await guild.channels.fetch(config.logChannelId).catch(() => null);
    if (!logCh) return;
    await logCh.send({ embeds: [buildModEmbed(action, moderator, target, reason, extra)] }).catch(() => {});
  } catch {
    // non-critique
  }
}

async function addWarning(guildId, userId, modId, reason) {
  return prisma.warning.create({ data: { guildId, userId, modId, reason } });
}

async function getWarnings(guildId, userId) {
  return prisma.warning.findMany({
    where: { guildId, userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function clearWarnings(guildId, userId) {
  return prisma.warning.deleteMany({ where: { guildId, userId } });
}

async function deleteWarning(id) {
  return prisma.warning.delete({ where: { id } });
}

async function getModLogs(guildId, userId, limit = 10) {
  return prisma.modLog.findMany({
    where: { guildId, userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

async function addModLog(guildId, userId, modId, action, reason = null, duration = null) {
  return prisma.modLog.create({ data: { guildId, userId, modId, action, reason, duration } });
}

module.exports = { addWarning, getWarnings, clearWarnings, deleteWarning, getModLogs, addModLog, sendModLog };
