// src/events/guildMemberRemove.js
const logger = require('../utils/logger');
const prisma = require('../database/prisma');
const { buildLeaveEmbed } = require('../embeds/welcomeEmbed');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, client) {
    try {
      if (client.inviteTracker) {
        await client.inviteTracker.handleLeave(member.guild, member);
      }

      const config = await prisma.guildConfig.findUnique({ where: { guildId: member.guild.id } });
      if (!config?.welcomeChannelId) return;
      const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
      if (!channel) return;

      const embed = buildLeaveEmbed(member, member.guild.memberCount);
      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      logger.error(`guildMemberRemove error: ${err.message}`);
    }
  },
};
