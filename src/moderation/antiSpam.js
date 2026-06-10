// src/moderation/antiSpam.js
const messageCache = new Map();

const SPAM_THRESHOLD = 5;
const SPAM_WINDOW_MS = 5000;
const IDENTICAL_THRESHOLD = 3;

function checkSpam(message) {
  if (message.author.bot) return false;
  const userId = message.author.id;
  const now = Date.now();

  if (!messageCache.has(userId)) {
    messageCache.set(userId, []);
  }

  const history = messageCache.get(userId).filter(m => now - m.timestamp < SPAM_WINDOW_MS);
  history.push({ content: message.content, timestamp: now });
  messageCache.set(userId, history);

  if (history.length >= SPAM_THRESHOLD) return true;

  const identical = history.filter(m => m.content === message.content).length;
  if (identical >= IDENTICAL_THRESHOLD) return true;

  return false;
}

function clearCache(userId) {
  messageCache.delete(userId);
}

module.exports = { checkSpam, clearCache };
