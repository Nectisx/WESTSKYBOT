// src/commands/admin/logs.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed } = require('../../embeds/baseEmbed');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { updateConfig } = require('../../services/configService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurer le salon de logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Définir le salon de logs')
      .addChannelOption(opt => opt.setName('salon').setDescription('Salon de logs').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub.setName('disable').setDescription('Désactiver les logs')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [permissionError('Manage Guild')], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const salon = interaction.options.getChannel('salon');
      await updateConfig(interaction.guildId, { logChannelId: salon.id });
      await interaction.reply({ embeds: [successEmbed('Logs configurés', `Salon de logs défini sur <#${salon.id}>.`)] });
    } else {
      await updateConfig(interaction.guildId, { logChannelId: null });
      await interaction.reply({ embeds: [successEmbed('Logs désactivés', 'Les logs ont été désactivés.')] });
    }
  },
};
