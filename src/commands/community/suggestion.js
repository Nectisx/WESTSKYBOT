// src/commands/community/suggestion.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed, brandFooter } = require('../../embeds/baseEmbed');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Système de suggestions')
    .addSubcommand(sub => sub
      .setName('envoyer')
      .setDescription('Soumettre une suggestion')
      .addStringOption(opt => opt.setName('contenu').setDescription('Ta suggestion').setRequired(true).setMaxLength(1000))
    )
    .addSubcommand(sub => sub
      .setName('repondre')
      .setDescription('[Staff] Accepter ou refuser une suggestion')
      .addStringOption(opt => opt.setName('message_id').setDescription('ID du message de la suggestion').setRequired(true))
      .addStringOption(opt => opt.setName('statut').setDescription('Décision').setRequired(true)
        .addChoices(
          { name: '✅ Acceptée', value: 'accepted' },
          { name: '❌ Refusée', value: 'denied' },
        ))
      .addStringOption(opt => opt.setName('reponse').setDescription('Réponse du staff').setMaxLength(500))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config?.suggestionChannelId) {
      return interaction.reply({ embeds: [errorEmbed('Non configuré', 'Le salon de suggestions n\'est pas configuré (`/config`).')], ephemeral: true });
    }
    const channel = await interaction.guild.channels.fetch(config.suggestionChannelId).catch(() => null);
    if (!channel) return interaction.reply({ embeds: [errorEmbed('Salon introuvable', 'Le salon de suggestions est introuvable.')], ephemeral: true });

    if (sub === 'envoyer') {
      const content = interaction.options.getString('contenu');

      const embed = new EmbedBuilder()
        .setColor(COLORS.SECONDARY)
        .setTitle('💡 Nouvelle suggestion')
        .setDescription(content)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .addFields({ name: '📊 Statut', value: '⏳ En attente' })
        .setFooter(brandFooter())
        .setTimestamp();

      const msg = await channel.send({ embeds: [embed] });
      await msg.react('✅').catch(() => {});
      await msg.react('❌').catch(() => {});

      try {
        await prisma.suggestion.create({
          data: { guildId: interaction.guildId, messageId: msg.id, userId: interaction.user.id, content },
        });
      } catch (err) {
        logger.debug(`suggestion db: ${err.message}`);
      }

      return interaction.reply({ embeds: [successEmbed('Suggestion envoyée', `Ta suggestion a été soumise dans <#${channel.id}>.`)], ephemeral: true });
    }

    if (sub === 'repondre') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu dois avoir la permission **Manage Guild**.')], ephemeral: true });
      }

      const messageId = interaction.options.getString('message_id');
      const statut = interaction.options.getString('statut');
      const reponse = interaction.options.getString('reponse') || null;

      const suggestion = await prisma.suggestion.findFirst({ where: { guildId: interaction.guildId, messageId } });
      if (!suggestion) {
        return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Aucune suggestion trouvée avec cet ID de message.')], ephemeral: true });
      }

      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (!msg) {
        return interaction.reply({ embeds: [errorEmbed('Message introuvable', 'Le message de la suggestion a été supprimé.')], ephemeral: true });
      }

      const accepted = statut === 'accepted';
      const statusLabel = accepted ? '✅ Acceptée' : '❌ Refusée';

      const updated = EmbedBuilder.from(msg.embeds[0])
        .setColor(accepted ? COLORS.SUCCESS : COLORS.DANGER)
        .setFields(
          { name: '📊 Statut', value: `${statusLabel} par ${interaction.user.tag}` },
          ...(reponse ? [{ name: '💬 Réponse du staff', value: reponse }] : []),
        );
      await msg.edit({ embeds: [updated] }).catch(() => {});

      await prisma.suggestion.update({
        where: { id: suggestion.id },
        data: { status: statut, response: reponse },
      });

      // Prévenir l'auteur en DM
      const author = await interaction.client.users.fetch(suggestion.userId).catch(() => null);
      if (author) {
        await author.send({
          embeds: [new EmbedBuilder()
            .setColor(accepted ? COLORS.SUCCESS : COLORS.DANGER)
            .setTitle(`${statusLabel.split(' ')[0]} Ta suggestion a été ${accepted ? 'acceptée' : 'refusée'}`)
            .setDescription(`**Suggestion :** ${suggestion.content.slice(0, 500)}${reponse ? `\n**Réponse :** ${reponse}` : ''}`)
            .setFooter(brandFooter())
            .setTimestamp()],
        }).catch(() => {});
      }

      return interaction.reply({ embeds: [successEmbed('Suggestion traitée', `La suggestion est maintenant : **${statusLabel}**`)], ephemeral: true });
    }
  },
};
