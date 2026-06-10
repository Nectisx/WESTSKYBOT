// src/commands/music/queue.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { buildPaginationRow } = require('../../utils/pagination');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Voir la file d\'attente'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || (!player.playing && !player.paused && !player.currentTrack)) {
      return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    }
    const embed = player.buildQueueEmbed(0);
    const totalPages = player.queue.totalPages();
    const components = totalPages > 1 ? [buildPaginationRow(0, totalPages, 'queue')] : [];
    await interaction.reply({ embeds: [embed], components });
  },
};
