// src/commands/admin/ghostping.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { successEmbed } = require('../../embeds/baseEmbed');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ghostping')
    .setDescription('Configurer les ghost pings à l\'arrivée des membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter un salon au ghost ping')
      .addChannelOption(opt => opt
        .setName('salon')
        .setDescription('Salon où ghost pinger les nouveaux membres')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Retirer un salon du ghost ping')
      .addChannelOption(opt => opt
        .setName('salon')
        .setDescription('Salon à retirer')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('Voir les salons configurés pour le ghost ping')
    )
    .addSubcommand(sub => sub
      .setName('clear')
      .setDescription('Désactiver le ghost ping (retirer tous les salons)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    const channels = config ? JSON.parse(config.ghostPingChannels || '[]') : [];

    if (sub === 'add') {
      const salon = interaction.options.getChannel('salon');
      if (channels.includes(salon.id)) {
        return interaction.reply({ embeds: [errorEmbed('Déjà ajouté', `${salon} est déjà dans la liste de ghost ping.`)], ephemeral: true });
      }
      channels.push(salon.id);
      await prisma.guildConfig.upsert({
        where: { guildId: interaction.guildId },
        update: { ghostPingChannels: JSON.stringify(channels) },
        create: { guildId: interaction.guildId, ghostPingChannels: JSON.stringify(channels) },
      });
      return interaction.reply({ embeds: [successEmbed('Ghost ping activé', `${salon} ajouté. Les nouveaux membres seront ghost pingés ici.`)] });
    }

    if (sub === 'remove') {
      const salon = interaction.options.getChannel('salon');
      const filtered = channels.filter(id => id !== salon.id);
      if (filtered.length === channels.length) {
        return interaction.reply({ embeds: [errorEmbed('Non configuré', `${salon} n'est pas dans la liste.`)], ephemeral: true });
      }
      await prisma.guildConfig.update({
        where: { guildId: interaction.guildId },
        data: { ghostPingChannels: JSON.stringify(filtered) },
      });
      return interaction.reply({ embeds: [successEmbed('Salon retiré', `${salon} retiré de la liste de ghost ping.`)] });
    }

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('👻 Ghost ping — salons configurés')
        .setDescription(
          channels.length > 0
            ? channels.map(id => `<#${id}>`).join('\n')
            : 'Aucun salon configuré. Utilise `/ghostping add <salon>` pour en ajouter.'
        )
        .setFooter({ text: `⚔️ WestSky • ${date}` })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'clear') {
      await prisma.guildConfig.upsert({
        where: { guildId: interaction.guildId },
        update: { ghostPingChannels: '[]' },
        create: { guildId: interaction.guildId, ghostPingChannels: '[]' },
      });
      return interaction.reply({ embeds: [successEmbed('Ghost ping désactivé', 'Tous les salons ont été retirés.')] });
    }
  },
};
