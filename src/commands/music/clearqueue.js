// src/commands/music/clearqueue.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Vider la file d\'attente (garde la piste en cours)'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    const waiting = queue ? queue.songs.length - 1 : 0;
    if (!queue || waiting === 0) return interaction.reply({ embeds: [errorEmbed('File vide', 'La file d\'attente est déjà vide.')], ephemeral: true });
    // Keep only the current song (index 0)
    queue.songs.splice(1);
    await interaction.reply({ embeds: [successEmbed('🗑️ File vidée', `**${waiting}** piste(s) supprimée(s). La piste en cours continue.`)] });
  },
};
