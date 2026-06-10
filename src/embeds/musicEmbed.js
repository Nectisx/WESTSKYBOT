// src/embeds/musicEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

function buildNowPlayingEmbed(track, player) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const loopLabel = { none: '❌', track: '🔂', queue: '🔁' };
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.MUSIC} Lecture en cours`)
    .setDescription(`**[${track.title}](${track.url})**\nPar **${track.author}**`)
    .addFields(
      { name: '⏱️ Durée', value: track.duration, inline: true },
      { name: '🔊 Volume', value: `${player.volume}%`, inline: true },
      { name: '🔁 Boucle', value: loopLabel[player.loopMode] || '❌', inline: true },
      { name: '🎵 File d\'attente', value: `${player.queue.size} piste(s)`, inline: true },
      { name: '👤 Ajouté par', value: `<@${track.requestedBy}>`, inline: true },
    )
    .setThumbnail(track.thumbnail || null)
    .setFooter({ text: `⚔️ Fantasy Bot • ${date}` })
    .setTimestamp();
}

function buildQueueEmbed(tracks, currentTrack, page, totalPages) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const list = tracks.map((t, i) => `**${i + 1 + page * 10}.** [${t.title}](${t.url}) — <@${t.requestedBy}>`).join('\n');
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.MUSIC} File d'attente`)
    .setDescription(`▶️ **Lecture :** ${currentTrack ? `[${currentTrack.title}](${currentTrack.url})` : 'Rien'}\n\n${list || 'File vide.'}`)
    .setFooter({ text: `⚔️ Fantasy Bot • ${date} • Page ${page + 1}/${totalPages}` })
    .setTimestamp();
}

module.exports = { buildNowPlayingEmbed, buildQueueEmbed };
