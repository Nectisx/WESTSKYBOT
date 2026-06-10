// src/commands/music/clearqueue.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Vider la file d\'attente'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || player.queue.size === 0) return interaction.reply({ embeds: [errorEmbed('File vide', 'La file d\'attente est déjà vide.')], ephemeral: true });
    const count = player.queue.size;
    player.queue.clear();
    await interaction.reply({ embeds: [successEmbed('🗑️ File vidée', `${count} piste(s) supprimée(s).`)] });
  },
};
