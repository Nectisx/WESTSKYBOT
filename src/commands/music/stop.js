// src/commands/music/stop.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrêter la musique et vider la file d\'attente'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    player.stop();
    await interaction.reply({ embeds: [successEmbed('⏹️ Arrêté', 'Lecture arrêtée. Le bot se déconnectera dans 30 secondes.')] });
  },
};
