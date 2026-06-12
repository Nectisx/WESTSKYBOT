// src/commands/music/resume.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reprendre la lecture'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.paused) return interaction.reply({ embeds: [errorEmbed('Non en pause', 'La musique n\'est pas en pause.')], ephemeral: true });
    client.distube.resume(interaction.guild);
    await interaction.reply({ embeds: [successEmbed('▶️ Reprise', `Lecture de **${queue.songs[0]?.name}** reprise.`)] });
  },
};
