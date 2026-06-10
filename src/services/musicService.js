// src/services/musicService.js
const MusicPlayer = require('../music/MusicPlayer');

const players = new Map();

function getPlayer(guildId) {
  return players.get(guildId) || null;
}

function getOrCreatePlayer(guildId) {
  if (!players.has(guildId)) {
    players.set(guildId, new MusicPlayer(guildId));
  }
  return players.get(guildId);
}

function destroyPlayer(guildId) {
  const player = players.get(guildId);
  if (player) {
    player.destroy();
    players.delete(guildId);
  }
}

module.exports = { getPlayer, getOrCreatePlayer, destroyPlayer };
