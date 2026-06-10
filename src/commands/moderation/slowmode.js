// src/commands/moderation/slowmode.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Définir le slowmode d\'un salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt => opt.setName('secondes').setDescription('Délai en secondes (0 pour désactiver)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [permissionError('Manage Channels')], ephemeral: true });
    }
    const seconds = interaction.options.getInteger('secondes');
    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      const msg = seconds === 0 ? 'Slowmode désactivé.' : `Slowmode défini à **${seconds}** seconde(s).`;
      await interaction.reply({ embeds: [successEmbed('🐌 Slowmode', msg)] });
    } catch (err) {
      logger.error(`slowmode: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
