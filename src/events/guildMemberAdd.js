// src/events/guildMemberAdd.js
const logger = require('../utils/logger');
const prisma = require('../database/prisma');
const { buildWelcomeEmbed } = require('../embeds/welcomeEmbed');
const { formatWelcomeMessage } = require('../services/welcomeService');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    try {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: member.guild.id } });
      if (!config) return;

      // Attribution rôle automatique
      if (config.memberRoleId) {
        await member.roles.add(config.memberRoleId).catch(err => {
          logger.warn(`Impossible d'attribuer le rôle membre: ${err.message}`);
        });
      }

      // Trouver l'inviteur
      let inviterUser = null;
      let inviterStats = null;
      if (client.inviteTracker) {
        const inviterData = await client.inviteTracker.findInviter(member.guild, member);
        if (inviterData?.inviterId) {
          await client.inviteTracker.updateStats(member.guild.id, inviterData.inviterId, member.id, inviterData.code);
          inviterUser = await client.users.fetch(inviterData.inviterId).catch(() => null);
          if (inviterUser) {
            inviterStats = await prisma.inviteStats.findUnique({
              where: { guildId_userId: { guildId: member.guild.id, userId: inviterData.inviterId } },
            });
          }
        }
      }

      // Ghost ping dans les salons configurés
      const ghostChannels = JSON.parse(config.ghostPingChannels || '[]');
      for (const chId of ghostChannels) {
        const ch = await member.guild.channels.fetch(chId).catch(() => null);
        if (!ch) continue;
        const msg = await ch.send({ content: `<@${member.id}>` }).catch(() => null);
        if (msg) setTimeout(() => msg.delete().catch(() => {}), 500);
      }

      if (!config.welcomeChannelId) return;
      const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
      if (!channel) return;

      const memberCount = member.guild.memberCount;

      if (config.welcomeMessage) {
        const msg = formatWelcomeMessage(config.welcomeMessage, {
          user: `<@${member.id}>`,
          server: member.guild.name,
          count: memberCount,
          inviter: inviterUser ? inviterUser.tag : 'Inconnu',
        });
        await channel.send({ content: msg }).catch(() => {});
      } else {
        const embed = buildWelcomeEmbed(member, inviterUser, inviterStats, memberCount);
        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      logger.error(`guildMemberAdd error: ${err.message}`);
    }
  },
};
