// src/commands/music/volume.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');
const { LIMITS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Régler le volume')
    .addIntegerOption(opt => opt.setName('niveau').setDescription('Volume (0-200)').setRequired(true).setMinValue(0).setMaxValue(LIMITS.VOLUME_MAX)),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucun lecteur actif.')], ephemeral: true });
    const vol = interaction.options.getInteger('niveau');
    player.setVolume(vol);
    await interaction.reply({ embeds: [successEmbed('🔊 Volume', `Volume réglé à **${vol}%**.`)] });
  },
};
