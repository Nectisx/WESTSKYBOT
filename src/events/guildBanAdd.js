// src/events/guildBanAdd.js
const logger = require('../utils/logger');

module.exports = {
  name: 'guildBanAdd',
  once: false,
  async execute(ban, client) {
    logger.info(`Bannissement: ${ban.user.tag} dans ${ban.guild.name}`);
  },
};
