// src/services/economyService.js
const prisma = require('../database/prisma');

const DAILY_AMOUNT = 100;

async function getProfile(guildId, userId) {
  return prisma.userProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {},
    create: { guildId, userId },
  });
}

async function addBalance(guildId, userId, amount) {
  return prisma.userProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: { balance: { increment: amount } },
    create: { guildId, userId, balance: Math.max(0, amount) },
  });
}

async function removeBalance(guildId, userId, amount) {
  const profile = await getProfile(guildId, userId);
  if (profile.balance < amount) throw new Error('Fonds insuffisants');
  return prisma.userProfile.update({
    where: { guildId_userId: { guildId, userId } },
    data: { balance: { decrement: amount } },
  });
}

async function claimDaily(guildId, userId) {
  const profile = await getProfile(guildId, userId);
  const now = new Date();
  if (profile.lastDaily) {
    const elapsed = now.getTime() - profile.lastDaily.getTime();
    if (elapsed < 86400000) {
      const remaining = 86400000 - elapsed;
      throw new Error(`Reviens dans ${Math.ceil(remaining / 3600000)}h ${Math.ceil((remaining % 3600000) / 60000)}m`);
    }
  }
  return prisma.userProfile.update({
    where: { guildId_userId: { guildId, userId } },
    data: { balance: { increment: DAILY_AMOUNT }, lastDaily: now },
  });
}

async function getBalanceLeaderboard(guildId, limit = 10) {
  return prisma.userProfile.findMany({
    where: { guildId },
    orderBy: { balance: 'desc' },
    take: limit,
  });
}

async function getShopItems(guildId) {
  return prisma.shopItem.findMany({ where: { guildId }, orderBy: { price: 'asc' } });
}

async function buyItem(guildId, userId, itemId) {
  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item || item.guildId !== guildId) throw new Error('Article introuvable');
  if (item.stock === 0) throw new Error('Stock épuisé');

  const profile = await removeBalance(guildId, userId, item.price);

  if (item.stock > 0) {
    await prisma.shopItem.update({ where: { id: itemId }, data: { stock: { decrement: 1 } } });
  }

  const inventory = Array.isArray(profile.inventory) ? profile.inventory : JSON.parse(profile.inventory || '[]');
  inventory.push({ itemId, name: item.name, boughtAt: new Date().toISOString() });
  await prisma.userProfile.update({
    where: { guildId_userId: { guildId, userId } },
    data: { inventory: JSON.stringify(inventory) },
  });

  return { item, profile };
}

module.exports = { getProfile, addBalance, removeBalance, claimDaily, getBalanceLeaderboard, getShopItems, buyItem, DAILY_AMOUNT };
