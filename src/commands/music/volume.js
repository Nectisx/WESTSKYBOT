// src/commands/music/volume.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { LIMITS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Régler le volume')
    .addIntegerOption(opt => opt.setName('niveau').setDescription('Volume (0-200)').setRequired(true).setMinValue(0).setMaxValue(LIMITS.VOLUME_MAX)),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucun lecteur actif.')], ephemeral: true });
    const vol = interaction.options.getInteger('niveau');
    client.distube.setVolume(interaction.guild, vol);
    await interaction.reply({ embeds: [successEmbed('🔊 Volume', `Volume réglé à **${vol}%**.`)] });
  },
};
