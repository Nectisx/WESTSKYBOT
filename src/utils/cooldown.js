// src/utils/cooldown.js
const cooldowns = new Map();

function checkCooldown(commandName, userId, cooldownMs) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }
  const userCooldowns = cooldowns.get(commandName);
  const now = Date.now();
  if (userCooldowns.has(userId)) {
    const expiry = userCooldowns.get(userId);
    if (now < expiry) {
      return Math.ceil((expiry - now) / 1000);
    }
  }
  userCooldowns.set(userId, now + cooldownMs);
  return 0;
}

function clearCooldown(commandName, userId) {
  const userCooldowns = cooldowns.get(commandName);
  if (userCooldowns) userCooldowns.delete(userId);
}

// Purge périodique des cooldowns expirés (évite une croissance mémoire illimitée)
setInterval(() => {
  const now = Date.now();
  for (const [, userCooldowns] of cooldowns) {
    for (const [userId, expiry] of userCooldowns) {
      if (now >= expiry) userCooldowns.delete(userId);
    }
  }
}, 10 * 60 * 1000).unref();

module.exports = { checkCooldown, clearCooldown };
