// src/commands/music/shuffle.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mélanger la file d\'attente'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || player.queue.size === 0) return interaction.reply({ embeds: [errorEmbed('File vide', 'La file d\'attente est vide.')], ephemeral: true });
    player.shuffle();
    await interaction.reply({ embeds: [successEmbed('🔀 Mélangé', `La file d\'attente (${player.queue.size} pistes) a été mélangée.`)] });
  },
};
