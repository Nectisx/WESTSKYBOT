// src/services/moderationService.js
const prisma = require('../database/prisma');

async function addWarning(guildId, userId, modId, reason) {
  return prisma.warning.create({ data: { guildId, userId, modId, reason } });
}

async function getWarnings(guildId, userId) {
  return prisma.warning.findMany({
    where: { guildId, userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function clearWarnings(guildId, userId) {
  return prisma.warning.deleteMany({ where: { guildId, userId } });
}

async function deleteWarning(id) {
  return prisma.warning.delete({ where: { id } });
}

async function getModLogs(guildId, userId, limit = 10) {
  return prisma.modLog.findMany({
    where: { guildId, userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

async function addModLog(guildId, userId, modId, action, reason = null, duration = null) {
  return prisma.modLog.create({ data: { guildId, userId, modId, action, reason, duration } });
}

module.exports = { addWarning, getWarnings, clearWarnings, deleteWarning, getModLogs, addModLog };
