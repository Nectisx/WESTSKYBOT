// src/services/musicService.js
// Thin helpers — all music logic goes through client.distube directly

function getQueue(client, guildId) {
  return client.distube.getQueue(guildId) || null;
}

module.exports = { getQueue };
