// src/invites/InviteTracker.js
const prisma = require('../database/prisma');
const logger = require('../utils/logger');

class InviteTracker {
  constructor(client) {
    this.client = client;
    this.inviteCache = new Map();
  }

  async init() {
    for (const [guildId, guild] of this.client.guilds.cache) {
      try {
        const invites = await guild.invites.fetch();
        const guildCache = new Map();
        for (const [code, invite] of invites) {
          guildCache.set(code, { uses: invite.uses, inviterId: invite.inviter?.id ?? null });
        }
        this.inviteCache.set(guildId, guildCache);
      } catch (err) {
        logger.warn(`Impossible de charger les invitations pour ${guildId}: ${err.message}`);
      }
    }
    logger.info('InviteTracker initialisé');
  }

  onInviteCreate(invite) {
    const guildId = invite.guild.id;
    if (!this.inviteCache.has(guildId)) this.inviteCache.set(guildId, new Map());
    this.inviteCache.get(guildId).set(invite.code, {
      uses: invite.uses,
      inviterId: invite.inviter?.id ?? null,
    });
  }

  onInviteDelete(invite) {
    const guildId = invite.guild.id;
    if (this.inviteCache.has(guildId)) {
      this.inviteCache.get(guildId).delete(invite.code);
    }
  }

  async findInviter(guild, member) {
    try {
      const oldCache = this.inviteCache.get(guild.id) ?? new Map();
      const newInvites = await guild.invites.fetch();
      const newCache = new Map();
      for (const [code, invite] of newInvites) {
        newCache.set(code, { uses: invite.uses, inviterId: invite.inviter?.id ?? null });
      }
      this.inviteCache.set(guild.id, newCache);

      let inviterData = null;
      for (const [code, newData] of newCache) {
        const oldData = oldCache.get(code);
        if (!oldData || newData.uses > oldData.uses) {
          inviterData = { code, inviterId: newData.inviterId };
          break;
        }
      }
      return inviterData;
    } catch (err) {
      logger.warn(`Impossible de trouver l'inviteur pour ${member.id}: ${err.message}`);
      return null;
    }
  }

  async updateStats(guildId, inviterId, inviteeId, code) {
    try {
      await prisma.inviteRecord.create({
        data: { guildId, inviterId, inviteeId, code },
      });
      if (inviterId) {
        await prisma.inviteStats.upsert({
          where: { guildId_userId: { guildId, userId: inviterId } },
          update: { invites: { increment: 1 } },
          create: { guildId, userId: inviterId, invites: 1 },
        });
      }
    } catch (err) {
      logger.error(`Erreur mise à jour stats invitation: ${err.message}`);
    }
  }

  async handleLeave(guild, member) {
    try {
      const record = await prisma.inviteRecord.findFirst({
        where: { guildId: guild.id, inviteeId: member.id, leftAt: null },
        orderBy: { joinedAt: 'desc' },
      });
      if (!record) return;

      await prisma.inviteRecord.update({
        where: { id: record.id },
        data: { leftAt: new Date() },
      });

      if (record.inviterId) {
        await prisma.inviteStats.upsert({
          where: { guildId_userId: { guildId: guild.id, userId: record.inviterId } },
          update: { left: { increment: 1 } },
          create: { guildId: guild.id, userId: record.inviterId, left: 1 },
        });
      }
    } catch (err) {
      logger.error(`Erreur handleLeave: ${err.message}`);
    }
  }

  getScore(stats) {
    return stats.invites - stats.fake - stats.left + stats.bonus;
  }
}

module.exports = InviteTracker;
