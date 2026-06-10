// src/commands/music/pause.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Mettre la musique en pause'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || !player.playing) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    const result = player.pause();
    if (!result) return interaction.reply({ embeds: [errorEmbed('Déjà en pause', 'La musique est déjà en pause.')], ephemeral: true });
    await interaction.reply({ embeds: [successEmbed('⏸️ En pause', `**${player.currentTrack?.title}** a été mise en pause.`)] });
  },
};
