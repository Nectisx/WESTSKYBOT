// src/services/giveawayService.js
const prisma = require('../database/prisma');

async function getActiveGiveaways(guildId) {
  return prisma.giveaway.findMany({
    where: { guildId, status: 'active' },
    orderBy: { endsAt: 'asc' },
  });
}

async function getGiveawayById(id) {
  return prisma.giveaway.findUnique({ where: { id } });
}

async function getGiveawayByMessage(messageId) {
  return prisma.giveaway.findUnique({ where: { messageId } });
}

async function getEntryCount(giveawayId) {
  return prisma.giveawayEntry.count({ where: { giveawayId } });
}

async function getUserEntry(giveawayId, userId) {
  return prisma.giveawayEntry.findUnique({
    where: { giveawayId_userId: { giveawayId, userId } },
  });
}

async function createEntry(giveawayId, userId, tickets = 1) {
  return prisma.giveawayEntry.create({ data: { giveawayId, userId, tickets } });
}

async function deleteEntry(giveawayId, userId) {
  return prisma.giveawayEntry.deleteMany({ where: { giveawayId, userId } });
}

module.exports = {
  getActiveGiveaways, getGiveawayById, getGiveawayByMessage,
  getEntryCount, getUserEntry, createEntry, deleteEntry,
};
