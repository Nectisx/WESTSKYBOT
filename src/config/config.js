// src/config/config.js
require('dotenv').config();

module.exports = {
  token:    process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId:  process.env.GUILD_ID,
  database: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
  isDev:    process.env.NODE_ENV !== 'production',
};
