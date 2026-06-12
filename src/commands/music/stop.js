// src/commands/music/stop.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrêter la musique et vider la file d\'attente'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    await client.distube.stop(interaction.guild);
    await interaction.reply({ embeds: [successEmbed('⏹️ Arrêté', 'Lecture arrêtée et file vidée.')] });
  },
};
