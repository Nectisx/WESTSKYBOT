// src/giveaways/weightedRandom.js

function weightedRandom(entries) {
  if (!entries || entries.length === 0) return null;
  const pool = [];
  for (const entry of entries) {
    for (let i = 0; i < (entry.tickets || 1); i++) {
      pool.push(entry.userId);
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function weightedRandomMultiple(entries, count) {
  const pool = [];
  for (const entry of entries) {
    for (let i = 0; i < (entry.tickets || 1); i++) {
      pool.push(entry.userId);
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const winners = [];
  const seen = new Set();
  for (const userId of pool) {
    if (!seen.has(userId)) {
      seen.add(userId);
      winners.push(userId);
      if (winners.length >= count) break;
    }
  }
  return winners;
}

module.exports = { weightedRandom, weightedRandomMultiple };
