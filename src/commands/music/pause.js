// src/commands/music/pause.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Mettre la musique en pause'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || queue.paused) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours ou déjà en pause.')], ephemeral: true });
    client.distube.pause(interaction.guild);
    await interaction.reply({ embeds: [successEmbed('⏸️ En pause', `**${queue.songs[0]?.name}** mise en pause.`)] });
  },
};
