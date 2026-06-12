// src/embeds/musicEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

function buildNowPlayingEmbed(song, queue) {
  const loopLabel = { 0: '❌', 1: '🔂', 2: '🔁' };
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.MUSIC} Lecture en cours`)
    .setDescription(`**[${song.name}](${song.url})**\nPar **${song.uploader?.name || 'Inconnu'}**`)
    .addFields(
      { name: '⏱️ Durée', value: song.formattedDuration || '?', inline: true },
      { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
      { name: '🔁 Boucle', value: loopLabel[queue.repeatMode] ?? '❌', inline: true },
      { name: '🎵 File d\'attente', value: `${Math.max(0, queue.songs.length - 1)} piste(s)`, inline: true },
      { name: '👤 Ajouté par', value: song.member ? `<@${song.member.id}>` : 'Inconnu', inline: true },
    )
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: `⚔️ SOLARA • ${date}` })
    .setTimestamp();
}

function buildQueueEmbed(queue, page = 0) {
  const PER_PAGE = 10;
  const waiting = queue.songs.slice(1);
  const totalPages = Math.max(1, Math.ceil(waiting.length / PER_PAGE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = waiting.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  const list = slice.map((s, i) =>
    `**${i + 1 + safePage * PER_PAGE}.** [${s.name}](${s.url}) — <@${s.member?.id}>`
  ).join('\n');

  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.MUSIC} File d'attente`)
    .setDescription(
      `▶️ **Lecture :** ${queue.songs[0] ? `[${queue.songs[0].name}](${queue.songs[0].url})` : 'Rien'}\n\n${list || 'File vide.'}`
    )
    .setFooter({ text: `⚔️ SOLARA • ${date} • Page ${safePage + 1}/${totalPages}` })
    .setTimestamp();
}

module.exports = { buildNowPlayingEmbed, buildQueueEmbed };
