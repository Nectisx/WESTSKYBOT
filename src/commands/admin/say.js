// src/commands/admin/say.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faire parler le bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt => opt.setName('message').setDescription('Message à envoyer').setRequired(true))
    .addChannelOption(opt => opt.setName('salon').setDescription('Salon cible').addChannelTypes(ChannelType.GuildText)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [permissionError('Manage Messages')], ephemeral: true });
    }
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    try {
      await channel.send({ content: message });
      await interaction.reply({ content: '✅ Message envoyé.', ephemeral: true });
    } catch (err) {
      logger.error(`say: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
