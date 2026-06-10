// src/services/welcomeService.js
const prisma = require('../database/prisma');

function formatWelcomeMessage(template, vars) {
  return template
    .replace(/{user}/g, vars.user || '')
    .replace(/{server}/g, vars.server || '')
    .replace(/{count}/g, vars.count || '')
    .replace(/{inviter}/g, vars.inviter || 'Inconnu');
}

async function getWelcomeConfig(guildId) {
  return prisma.guildConfig.findUnique({
    where: { guildId },
    select: { welcomeChannelId: true, welcomeMessage: true, memberRoleId: true },
  });
}

module.exports = { formatWelcomeMessage, getWelcomeConfig };
