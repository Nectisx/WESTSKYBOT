// src/commands/music/resume.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reprendre la lecture'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || !player.paused) return interaction.reply({ embeds: [errorEmbed('Non en pause', 'La musique n\'est pas en pause.')], ephemeral: true });
    const result = player.resume();
    if (!result) return interaction.reply({ embeds: [errorEmbed('Erreur', 'Impossible de reprendre.')], ephemeral: true });
    await interaction.reply({ embeds: [successEmbed('▶️ Reprise', `Lecture de **${player.currentTrack?.title}** reprise.`)] });
  },
};
