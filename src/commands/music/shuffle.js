// src/commands/music/shuffle.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mélanger la file d\'attente'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    const waiting = queue ? queue.songs.length - 1 : 0;
    if (!queue || waiting === 0) return interaction.reply({ embeds: [errorEmbed('File vide', 'La file d\'attente est vide.')], ephemeral: true });
    client.distube.shuffle(interaction.guild);
    await interaction.reply({ embeds: [successEmbed('🔀 Mélangé', `La file d'attente (**${waiting}** piste(s)) a été mélangée.`)] });
  },
};
