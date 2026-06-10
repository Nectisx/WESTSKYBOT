// src/services/configService.js
const prisma = require('../database/prisma');

async function getConfig(guildId) {
  return prisma.guildConfig.upsert({
    where: { guildId },
    update: {},
    create: { guildId },
  });
}

async function updateConfig(guildId, data) {
  return prisma.guildConfig.upsert({
    where: { guildId },
    update: data,
    create: { guildId, ...data },
  });
}

module.exports = { getConfig, updateConfig };
