// src/commands/music/nowplaying.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Voir la musique en cours de lecture'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || !player.currentTrack) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    const embed = player.buildNowPlayingEmbed();
    await interaction.reply({ embeds: [embed] });
  },
};
