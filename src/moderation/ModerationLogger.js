// src/moderation/ModerationLogger.js
const prisma = require('../database/prisma');
const logger = require('../utils/logger');
const { buildModEmbed } = require('../embeds/moderationEmbed');

class ModerationLogger {
  constructor(client) {
    this.client = client;
  }

  async log({ guildId, userId, modId, action, reason = null, duration = null }) {
    try {
      await prisma.modLog.create({
        data: { guildId, userId, modId, action, reason, duration },
      });
    } catch (err) {
      logger.error(`Erreur log modération: ${err.message}`);
    }
  }

  async sendLogToChannel(guild, action, moderator, target, reason, extra = {}) {
    try {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
      if (!config?.logChannelId) return;
      const channel = await guild.channels.fetch(config.logChannelId).catch(() => null);
      if (!channel) return;
      const embed = buildModEmbed(action, moderator, target, reason, extra);
      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error(`Erreur envoi log: ${err.message}`);
    }
  }

  async getLogs(guildId, userId, limit = 10) {
    return prisma.modLog.findMany({
      where: { guildId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

module.exports = ModerationLogger;
