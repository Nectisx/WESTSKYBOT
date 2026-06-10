// src/events/error.js
const logger = require('../utils/logger');

module.exports = {
  name: 'error',
  once: false,
  async execute(error, client) {
    logger.error(`Erreur Discord client: ${error.message}`);
  },
};
