// src/commands/moderation/lock.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Verrouiller un salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt => opt.setName('salon').setDescription('Salon à verrouiller'))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [permissionError('Manage Channels')], ephemeral: true });
    }
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ embeds: [successEmbed(`🔒 Salon verrouillé`, `<#${channel.id}> a été verrouillé.\n**Raison :** ${raison}`)] });
    } catch (err) {
      logger.error(`lock: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
