// src/commands/community/ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { ticketCloseRow, ticketPanelSelectRow } = require('../../components/buttons');
const prisma = require('../../database/prisma');
const { COLORS } = require('../../config/constants');
const TICKET_CATEGORIES = require('../../config/ticketCategories');
const logger = require('../../utils/logger');

async function buildTicketTranscript(channel, ticket) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const lines = [
      `=== TRANSCRIPT — ${ticket.subject || ticket.category || 'Ticket'} ===`,
      `Ouvert par : ${ticket.userId}`,
      `Problème : ${ticket.problem || 'Non précisé'}`,
      ``,
      ...sorted.map(m => {
        const time = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const content = m.content || (m.embeds.length ? '[Embed]' : '[Pièce jointe]');
        return `[${time}] ${m.author.tag}: ${content}`;
      }),
    ];
    return lines.join('\n');
  } catch {
    return 'Impossible de récupérer les messages.';
  }
}

async function sendTicketCloseDmAndLog(interaction, ticket) {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const openedAt = new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const recapEmbed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🎫 Récapitulatif de ton ticket')
    .addFields(
      { name: '📂 Catégorie', value: ticket.subject || ticket.category || 'Non précisé', inline: true },
      { name: '🎮 Pseudo Minecraft', value: ticket.minecraftPseudo || 'Non précisé', inline: true },
      { name: '​', value: '​', inline: true },
      { name: '📋 Problème', value: ticket.problem || 'Non précisé', inline: false },
      { name: '📸 Preuve', value: ticket.hasProof || 'Non précisé', inline: true },
      { name: '📅 Ouvert le', value: openedAt, inline: true },
      { name: '🔒 Fermé par', value: interaction.user.tag, inline: true },
    )
    .setFooter({ text: `⚔️ WestSky • ${date}` })
    .setTimestamp();

  const creator = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
  if (creator) await creator.user.send({ embeds: [recapEmbed] }).catch(() => {});

  const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  const transcriptText = await buildTicketTranscript(interaction.channel, ticket);
  const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptText, 'utf-8'), { name: `transcript-${interaction.channel.name}.txt` });

  if (config?.logChannelId) {
    const logCh = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
    if (logCh) {
      const logEmbed = new EmbedBuilder()
        .setColor(COLORS.DANGER)
        .setTitle('🔒 Ticket fermé')
        .addFields(
          { name: '👤 Créateur', value: `<@${ticket.userId}>`, inline: true },
          { name: '🛡️ Fermé par', value: interaction.user.tag, inline: true },
          { name: '📂 Catégorie', value: ticket.subject || ticket.category || 'Non précisé', inline: true },
          { name: '🎮 Pseudo MC', value: ticket.minecraftPseudo || 'Non précisé', inline: true },
          { name: '📋 Problème', value: (ticket.problem || 'Non précisé').slice(0, 200), inline: false },
        )
        .setFooter({ text: `⚔️ WestSky • ${date}` })
        .setTimestamp();
      await logCh.send({ embeds: [logEmbed], files: [transcriptFile] }).catch(() => {});
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Système de tickets')
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Créer le panneau de tickets dans un salon')
      .addChannelOption(opt => opt
        .setName('salon')
        .setDescription('Salon où afficher le panneau de tickets')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
      .addStringOption(opt => opt
        .setName('titre')
        .setDescription('Titre de l\'embed du panneau')
        .setRequired(false)
      )
    )
    .addSubcommand(sub => sub.setName('close').setDescription('Fermer le ticket actuel'))
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter un membre au ticket actuel')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à ajouter').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu dois être administrateur pour utiliser cette commande.')], ephemeral: true });
      }

      const channel = interaction.options.getChannel('salon');
      const title = interaction.options.getString('titre') || '🎫 Ouvrir un ticket';
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const categoryList = TICKET_CATEGORIES.map(c => `${c.emoji} **${c.label.replace(/[^ -~À-ɏ\u{1F000}-\u{1FFFF}]/gu, '')}**`).join('\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(title)
        .setDescription(
          'Sélectionne une catégorie dans le menu ci-dessous pour ouvrir un ticket.\n' +
          'Notre équipe de support te répondra dans les plus brefs délais.\n\n' +
          '**Catégories disponibles :**\n' +
          TICKET_CATEGORIES.map(c => `${c.emoji} **${c.label.split(' ').slice(1).join(' ')}** — ${c.description}`).join('\n')
        )
        .setFooter({ text: `⚔️ WestSky • ${date}` })
        .setTimestamp();

      const row = ticketPanelSelectRow();

      await interaction.deferReply({ ephemeral: true });

      try {
        const msg = await channel.send({ embeds: [embed], components: [row] });

        await prisma.ticketPanel.upsert({
          where: { guildId: interaction.guildId },
          update: { channelId: channel.id, messageId: msg.id, title },
          create: { guildId: interaction.guildId, channelId: channel.id, messageId: msg.id, title },
        });

        await interaction.editReply({ content: `✅ Panneau de tickets créé dans ${channel} !` });
        logger.info(`[Ticket] Panneau créé dans #${channel.name} par ${interaction.user.tag}`);
      } catch (err) {
        logger.error(`[Ticket setup] ${err.message}`);
        await interaction.editReply({ content: `❌ Erreur lors de la création du panneau : ${err.message}` });
      }
      return;
    }

    if (sub === 'add') {
      const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId } });
      if (!ticket) return interaction.reply({ embeds: [errorEmbed('Pas un ticket', 'Ce salon n\'est pas un ticket.')], ephemeral: true });

      const canManage = ticket.userId === interaction.user.id || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
      if (!canManage) return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Seul le créateur du ticket ou le staff peut ajouter un membre.')], ephemeral: true });

      const userToAdd = interaction.options.getUser('utilisateur');
      try {
        await interaction.channel.permissionOverwrites.edit(userToAdd.id, {
          ViewChannel: true,
          SendMessages: true,
        });
        await interaction.reply({ embeds: [successEmbed('Membre ajouté', `${userToAdd} a été ajouté au ticket.`)] });
      } catch (err) {
        logger.error(`[Ticket add] ${err.message}`);
        await interaction.reply({ embeds: [errorEmbed('Erreur', `Impossible d'ajouter ${userToAdd} : ${err.message}`)], ephemeral: true });
      }
      return;
    }

    if (sub === 'close') {
      const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId } });
      if (!ticket) return interaction.reply({ embeds: [errorEmbed('Pas un ticket', 'Ce salon n\'est pas un ticket.')], ephemeral: true });
      const canClose = ticket.userId === interaction.user.id || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
      if (!canClose) return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu ne peux pas fermer ce ticket.')], ephemeral: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_ticket_close').setLabel('🔒 Confirmer la fermeture').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_ticket_close').setLabel('↩️ Annuler').setStyle(ButtonStyle.Secondary),
      );
      const reply = await interaction.reply({
        content: '⚠️ Es-tu sûr de vouloir fermer ce ticket ?',
        components: [row],
        fetchReply: true,
      });

      try {
        const btn = await reply.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 });
        if (btn.customId === 'confirm_ticket_close') {
          await prisma.ticket.update({ where: { channelId: interaction.channelId }, data: { status: 'closed', closedAt: new Date() } });
          await sendTicketCloseDmAndLog(interaction, ticket);
          await btn.update({ content: '🔒 Ticket fermé. Suppression dans 5 secondes.', components: [] });
          setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        } else {
          await btn.update({ content: '↩️ Fermeture annulée.', components: [] });
        }
      } catch {
        await interaction.editReply({ content: '⏰ Temps écoulé. Fermeture annulée.', components: [] });
      }
    }
  },
};
