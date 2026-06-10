// src/services/inviteService.js
const prisma = require('../database/prisma');

async function getStats(guildId, userId) {
  return prisma.inviteStats.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {},
    create: { guildId, userId },
  });
}

async function getLeaderboard(guildId, limit = 10) {
  return prisma.inviteStats.findMany({
    where: { guildId },
    orderBy: [
      { invites: 'desc' },
    ],
    take: limit,
  });
}

async function addBonus(guildId, userId, amount) {
  return prisma.inviteStats.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: { bonus: { increment: amount } },
    create: { guildId, userId, bonus: Math.max(0, amount) },
  });
}

async function removeBonus(guildId, userId, amount) {
  const stats = await getStats(guildId, userId);
  const newBonus = Math.max(0, stats.bonus - amount);
  return prisma.inviteStats.update({
    where: { guildId_userId: { guildId, userId } },
    data: { bonus: newBonus },
  });
}

async function resetStats(guildId, userId) {
  return prisma.inviteStats.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: { invites: 0, fake: 0, left: 0, bonus: 0 },
    create: { guildId, userId },
  });
}

module.exports = { getStats, getLeaderboard, addBonus, removeBonus, resetStats };
