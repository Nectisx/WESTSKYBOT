// src/commands/welcome/setup.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { updateConfig } = require('../../services/configService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Gérer le système de bienvenue')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Configurer le salon et le message de bienvenue')
      .addChannelOption(opt => opt.setName('salon').setDescription('Salon de bienvenue').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addStringOption(opt => opt.setName('message').setDescription('Message (vars: {user}, {server}, {count}, {inviter})'))
      .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle automatique à l\'arrivée'))
    )
    .addSubcommand(sub => sub
      .setName('channel')
      .setDescription('Changer le salon de bienvenue')
      .addChannelOption(opt => opt.setName('salon').setDescription('Nouveau salon').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub
      .setName('message')
      .setDescription('Modifier le message de bienvenue')
      .addStringOption(opt => opt.setName('message').setDescription('Nouveau message ({user}, {server}, {count}, {inviter})').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('test')
      .setDescription('Tester le message de bienvenue')
    )
    .addSubcommand(sub => sub
      .setName('disable')
      .setDescription('Désactiver le système de bienvenue')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const salon = interaction.options.getChannel('salon');
      const message = interaction.options.getString('message') || null;
      const role = interaction.options.getRole('rôle');
      const data = { welcomeChannelId: salon.id };
      if (message) data.welcomeMessage = message;
      if (role) data.memberRoleId = role.id;
      await updateConfig(interaction.guildId, data);
      await interaction.reply({ embeds: [successEmbed('Bienvenue configurée', `Salon: <#${salon.id}>${role ? `\nRôle auto: <@&${role.id}>` : ''}${message ? `\nMessage: ${message}` : ''}`)] });
    }

    else if (sub === 'channel') {
      const salon = interaction.options.getChannel('salon');
      await updateConfig(interaction.guildId, { welcomeChannelId: salon.id });
      await interaction.reply({ embeds: [successEmbed('Salon modifié', `Salon de bienvenue: <#${salon.id}>`)] });
    }

    else if (sub === 'message') {
      const msg = interaction.options.getString('message');
      await updateConfig(interaction.guildId, { welcomeMessage: msg });
      await interaction.reply({ embeds: [successEmbed('Message modifié', `Nouveau message:\n\`${msg}\``)] });
    }

    else if (sub === 'test') {
      const prisma = require('../../database/prisma');
      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      if (!config?.welcomeChannelId) {
        return interaction.reply({ embeds: [errorEmbed('Non configuré', 'Configure d\'abord le salon avec `/welcome setup`.')], ephemeral: true });
      }
      const channel = await interaction.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
      if (!channel) return interaction.reply({ embeds: [errorEmbed('Salon introuvable', 'Le salon configuré n\'existe plus.')], ephemeral: true });

      if (config.welcomeMessage) {
        const { formatWelcomeMessage } = require('../../services/welcomeService');
        const msg = formatWelcomeMessage(config.welcomeMessage, {
          user: interaction.user.toString(),
          server: interaction.guild.name,
          count: interaction.guild.memberCount,
          inviter: 'Test',
        });
        await channel.send({ content: msg });
      } else {
        const { buildWelcomeEmbed } = require('../../embeds/welcomeEmbed');
        const embed = buildWelcomeEmbed(interaction.member, interaction.user, null, interaction.guild.memberCount);
        await channel.send({ embeds: [embed] });
      }
      await interaction.reply({ embeds: [successEmbed('Test envoyé', `Message de test envoyé dans <#${channel.id}>`)], ephemeral: true });
    }

    else if (sub === 'disable') {
      await updateConfig(interaction.guildId, { welcomeChannelId: null });
      await interaction.reply({ embeds: [successEmbed('Bienvenue désactivée', 'Le système de bienvenue a été désactivé.')] });
    }
  },
};
