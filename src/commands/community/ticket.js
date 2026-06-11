// src/commands/community/ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { ticketCloseRow } = require('../../components/buttons');
const prisma = require('../../database/prisma');
const { COLORS } = require('../../config/constants');
const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ouvrir un ticket de support')
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Ouvrir un nouveau ticket')
      .addStringOption(opt => opt.setName('sujet').setDescription('Sujet du ticket'))
    )
    .addSubcommand(sub => sub.setName('close').setDescription('Fermer le ticket actuel')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config?.ticketCategoryId) {
      return interaction.reply({ embeds: [errorEmbed('Non configuré', 'La catégorie tickets n\'est pas configurée. Utilise `/config set`.') ], ephemeral: true });
    }

    if (sub === 'create') {
      const subject = interaction.options.getString('sujet') || 'Support général';

      const existing = await prisma.ticket.findFirst({
        where: { guildId: interaction.guildId, userId: interaction.user.id, status: 'open' },
      });
      if (existing) {
        return interaction.reply({ embeds: [errorEmbed('Ticket existant', `Tu as déjà un ticket ouvert : <#${existing.channelId}>`)], ephemeral: true });
      }

      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username.slice(0, 15).toLowerCase()}`,
        type: ChannelType.GuildText,
        parent: config.ticketCategoryId,
        permissionOverwrites: [
          { id: interaction.guildId, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...(config.modRoleId ? [{ id: config.modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
        ],
      });

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`🎫 Ticket — ${subject}`)
        .setDescription(`Bienvenue ${interaction.user} !\n\nL\'équipe de support va te répondre dès que possible.\nPour fermer ce ticket, clique sur le bouton ci-dessous.`)
        .setFooter({ text: `⚔️ SOLARA • ${date}` })
        .setTimestamp();

      const row = ticketCloseRow();
      await channel.send({ content: interaction.user.toString(), embeds: [embed], components: [row] });

      await prisma.ticket.create({
        data: { guildId: interaction.guildId, channelId: channel.id, userId: interaction.user.id, subject },
      });

      await interaction.reply({ embeds: [successEmbed('Ticket créé', `Ton ticket a été créé : <#${channel.id}>`)], ephemeral: true });
    }

    else if (sub === 'close') {
      const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId } });
      if (!ticket) return interaction.reply({ embeds: [errorEmbed('Pas un ticket', 'Ce salon n\'est pas un ticket.')], ephemeral: true });
      const canClose = ticket.userId === interaction.user.id || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
      if (!canClose) return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu ne peux pas fermer ce ticket.')], ephemeral: true });
      await prisma.ticket.update({ where: { channelId: interaction.channelId }, data: { status: 'closed', closedAt: new Date() } });
      await interaction.reply({ content: '🔒 Ticket fermé. Suppression dans 5 secondes.' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  },
};
