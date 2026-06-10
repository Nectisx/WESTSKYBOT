// src/giveaways/GiveawayManager.js
const { EmbedBuilder } = require('discord.js');
const prisma = require('../database/prisma');
const logger = require('../utils/logger');
const { buildGiveawayEmbed, buildGiveawayEndedEmbed } = require('../embeds/giveawayEmbed');
const { giveawayRow } = require('../components/buttons');
const { formatTimeRemaining } = require('../utils/timeParser');

class GiveawayManager {
  constructor(client) {
    this.client = client;
    this.timers = new Map();
    this.updaters = new Map();
  }

  async create({ guildId, channelId, prize, winnersCount, duration, hostId,
    requiredRoleId = null, bonusRoles = [], customMessage = null }) {
    const endsAt = new Date(Date.now() + duration * 1000);

    const channel = await this.client.channels.fetch(channelId).catch(() => null);
    if (!channel) throw new Error('Salon introuvable');

    const embed = buildGiveawayEmbed({
      prize, winnersCount, endsAt, status: 'active',
      requiredRoleId, bonusRoles, id: 'temp',
    }, 0);

    const row = giveawayRow('temp');
    const msg = await channel.send({ embeds: [embed], components: [row] });

    const giveaway = await prisma.giveaway.create({
      data: {
        guildId, channelId, messageId: msg.id,
        prize, winnersCount, endsAt,
        hostId, requiredRoleId,
        bonusRoles: JSON.stringify(bonusRoles),
        customMessage,
        status: 'active',
      },
    });

    // Update the message with the real ID
    const realEmbed = buildGiveawayEmbed(giveaway, 0);
    const realRow = giveawayRow(giveaway.id);
    await msg.edit({ embeds: [realEmbed], components: [realRow] }).catch(() => {});

    this.scheduleEnd(giveaway);
    this.startEmbedUpdater(giveaway);
    logger.info(`Giveaway créé: ${giveaway.id} dans ${guildId}`);
    return giveaway;
  }

  scheduleEnd(giveaway) {
    const delay = new Date(giveaway.endsAt).getTime() - Date.now();
    if (delay <= 0) {
      this.end(giveaway.id);
      return;
    }
    const timer = setTimeout(() => this.end(giveaway.id), delay);
    this.timers.set(giveaway.id, timer);
  }

  startEmbedUpdater(giveaway) {
    const interval = setInterval(async () => {
      try {
        const fresh = await prisma.giveaway.findUnique({ where: { id: giveaway.id } });
        if (!fresh || fresh.status !== 'active') {
          clearInterval(interval);
          this.updaters.delete(giveaway.id);
          return;
        }
        const entriesCount = await prisma.giveawayEntry.count({ where: { giveawayId: giveaway.id } });
        const channel = await this.client.channels.fetch(fresh.channelId).catch(() => null);
        if (!channel) return;
        const msg = await channel.messages.fetch(fresh.messageId).catch(() => null);
        if (!msg) return;
        const embed = buildGiveawayEmbed(fresh, entriesCount);
        const row = giveawayRow(fresh.id);
        await msg.edit({ embeds: [embed], components: [row] }).catch(() => {});
      } catch (err) {
        logger.error(`Erreur updater giveaway ${giveaway.id}: ${err.message}`);
      }
    }, 30000);
    this.updaters.set(giveaway.id, interval);
  }

  async end(giveawayId) {
    const timer = this.timers.get(giveawayId);
    if (timer) { clearTimeout(timer); this.timers.delete(giveawayId); }
    const updater = this.updaters.get(giveawayId);
    if (updater) { clearInterval(updater); this.updaters.delete(giveawayId); }

    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.status !== 'active') return;

    const entries = await prisma.giveawayEntry.findMany({ where: { giveawayId } });
    const winners = this.weightedDraw(entries, giveaway.winnersCount);

    await prisma.giveaway.update({
      where: { id: giveawayId },
      data: { status: 'ended', endedAt: new Date(), winners },
    });

    const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;
    const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (msg) {
      const embed = buildGiveawayEndedEmbed(giveaway, winners);
      await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
    }

    const winnerMentions = winners.map(w => `<@${w}>`).join(', ');
    await channel.send({
      content: `${winnerMentions} ${winners.length > 0 ? `🎉 Félicitations ! Tu as gagné **${giveaway.prize}** !` : `Personne n'a participé, pas de gagnant pour **${giveaway.prize}**.`}`,
    }).catch(() => {});

    logger.info(`Giveaway terminé: ${giveawayId}, gagnants: ${winners.join(', ')}`);
    return winners;
  }

  async reroll(giveawayId, count = 1) {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.status !== 'ended') throw new Error('Giveaway non terminé');

    const entries = await prisma.giveawayEntry.findMany({ where: { giveawayId } });
    const newWinners = this.weightedDraw(entries, count);

    const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel) {
      const winnerMentions = newWinners.map(w => `<@${w}>`).join(', ');
      await channel.send({
        content: `🎲 **Reroll !** Nouveau(x) gagnant(s) pour **${giveaway.prize}** : ${winnerMentions || 'Aucun gagnant trouvé.'}`,
      }).catch(() => {});
    }
    return newWinners;
  }

  async cancel(giveawayId) {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || !['active', 'paused'].includes(giveaway.status)) throw new Error('Giveaway non annulable');

    const timer = this.timers.get(giveawayId);
    if (timer) { clearTimeout(timer); this.timers.delete(giveawayId); }
    const updater = this.updaters.get(giveawayId);
    if (updater) { clearInterval(updater); this.updaters.delete(giveawayId); }

    await prisma.giveaway.update({ where: { id: giveawayId }, data: { status: 'cancelled' } });

    const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel) {
      const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
      if (msg) {
        const embed = buildGiveawayEndedEmbed({ ...giveaway, prize: `~~${giveaway.prize}~~ (Annulé)` }, []);
        await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
      }
    }
  }

  async pause(giveawayId) {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.status !== 'active') throw new Error('Giveaway non actif');

    const timer = this.timers.get(giveawayId);
    if (timer) { clearTimeout(timer); this.timers.delete(giveawayId); }
    const updater = this.updaters.get(giveawayId);
    if (updater) { clearInterval(updater); this.updaters.delete(giveawayId); }

    await prisma.giveaway.update({ where: { id: giveawayId }, data: { status: 'paused' } });
    return await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  }

  async resume(giveawayId) {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.status !== 'paused') throw new Error('Giveaway non en pause');

    await prisma.giveaway.update({ where: { id: giveawayId }, data: { status: 'active' } });
    const updated = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    this.scheduleEnd(updated);
    this.startEmbedUpdater(updated);
    return updated;
  }

  calculateTickets(member, bonusRoles) {
    let tickets = 1;
    const roles = Array.isArray(bonusRoles) ? bonusRoles : JSON.parse(bonusRoles || '[]');
    for (const bonus of roles) {
      if (member.roles.cache.has(bonus.roleId)) {
        tickets = Math.max(tickets, bonus.multiplier);
      }
    }
    return tickets;
  }

  weightedDraw(entries, count) {
    if (entries.length === 0) return [];
    const pool = [];
    for (const entry of entries) {
      for (let i = 0; i < (entry.tickets || 1); i++) {
        pool.push(entry.userId);
      }
    }
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const winners = [];
    const seen = new Set();
    for (const userId of pool) {
      if (!seen.has(userId)) {
        seen.add(userId);
        winners.push(userId);
        if (winners.length >= count) break;
      }
    }
    return winners;
  }

  async restoreActiveGiveaways() {
    const active = await prisma.giveaway.findMany({
      where: { status: { in: ['active', 'paused'] } },
    });
    for (const giveaway of active) {
      if (giveaway.status === 'active') {
        if (new Date(giveaway.endsAt) <= new Date()) {
          await this.end(giveaway.id);
        } else {
          this.scheduleEnd(giveaway);
          this.startEmbedUpdater(giveaway);
        }
      }
    }
    logger.info(`${active.length} giveaway(s) restauré(s)`);
  }

  formatTimeRemaining(endsAt) {
    return formatTimeRemaining(new Date(endsAt));
  }
}

module.exports = GiveawayManager;
