// src/services/levelService.js
const prisma = require('../database/prisma');

function xpForLevel(level) {
  return 100 * Math.pow(level + 1, 1.5);
}

async function addXp(guildId, userId, amount) {
  let profile = await prisma.userProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: { xp: { increment: amount } },
    create: { guildId, userId, xp: amount },
  });

  let leveledUp = false;
  while (profile.xp >= xpForLevel(profile.level)) {
    profile = await prisma.userProfile.update({
      where: { guildId_userId: { guildId, userId } },
      data: { level: { increment: 1 } },
    });
    leveledUp = true;
  }
  return { profile, leveledUp };
}

async function getProfile(guildId, userId) {
  return prisma.userProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {},
    create: { guildId, userId },
  });
}

async function getLeaderboard(guildId, limit = 10) {
  return prisma.userProfile.findMany({
    where: { guildId },
    orderBy: [{ level: 'desc' }, { xp: 'desc' }],
    take: limit,
  });
}

module.exports = { xpForLevel, addXp, getProfile, getLeaderboard };
