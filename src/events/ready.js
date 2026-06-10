// src/events/ready.js
const logger = require('../utils/logger');
const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`✅ Bot connecté en tant que ${client.user.tag}`);
    logger.info(`📡 Sur ${client.guilds.cache.size} serveur(s)`);

    client.user.setActivity('⚔️ /menu pour commencer', { type: ActivityType.Playing });

    if (client.giveawayManager) {
      await client.giveawayManager.restoreActiveGiveaways();
    }
    if (client.inviteTracker) {
      await client.inviteTracker.init();
    }
  },
};
