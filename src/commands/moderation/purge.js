// src/commands/moderation/purge.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed, warningEmbed } = require('../../embeds/baseEmbed');
const { confirmRow } = require('../../components/buttons');
const { LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Supprimer des messages en masse')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub => sub
      .setName('messages')
      .setDescription('Supprimer des messages récents')
      .addIntegerOption(opt => opt.setName('quantité').setDescription('Nombre de messages (max 100)').setRequired(true).setMinValue(1).setMaxValue(LIMITS.PURGE_MAX))
    )
    .addSubcommand(sub => sub
      .setName('utilisateur')
      .setDescription('Supprimer les messages d\'un utilisateur')
      .addUserOption(opt => opt.setName('user').setDescription('Utilisateur cible').setRequired(true))
      .addIntegerOption(opt => opt.setName('quantité').setDescription('Nombre de messages à scanner').setMaxValue(LIMITS.PURGE_MAX))
    )
    .addSubcommand(sub => sub
      .setName('bots')
      .setDescription('Supprimer les messages des bots')
      .addIntegerOption(opt => opt.setName('quantité').setDescription('Nombre de messages à scanner').setMaxValue(LIMITS.PURGE_MAX))
    )
    .addSubcommand(sub => sub
      .setName('salon')
      .setDescription('Vider entièrement le salon (le supprime et le recrée)')
      .addBooleanOption(opt => opt.setName('confirmer').setDescription('Confirmer l\'opération').setRequired(true))
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [permissionError('Manage Messages')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'messages') {
      const qty = interaction.options.getInteger('quantité');
      await interaction.deferReply({ ephemeral: true });
      try {
        const deleted = await interaction.channel.bulkDelete(qty, true);
        await interaction.editReply({ embeds: [successEmbed('Purge effectuée', `${deleted.size} message(s) supprimé(s).`)] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'utilisateur') {
      const target = interaction.options.getUser('user');
      const qty = interaction.options.getInteger('quantité') || 50;
      await interaction.deferReply({ ephemeral: true });
      try {
        const messages = await interaction.channel.messages.fetch({ limit: qty });
        const toDelete = messages.filter(m => m.author.id === target.id);
        const deleted = await interaction.channel.bulkDelete(toDelete, true);
        await interaction.editReply({ embeds: [successEmbed('Purge utilisateur', `${deleted.size} message(s) de ${target.tag} supprimé(s).`)] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'bots') {
      const qty = interaction.options.getInteger('quantité') || 50;
      await interaction.deferReply({ ephemeral: true });
      try {
        const messages = await interaction.channel.messages.fetch({ limit: qty });
        const toDelete = messages.filter(m => m.author.bot);
        const deleted = await interaction.channel.bulkDelete(toDelete, true);
        await interaction.editReply({ embeds: [successEmbed('Purge bots', `${deleted.size} message(s) de bots supprimé(s).`)] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'salon') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ embeds: [permissionError('Administrator')], ephemeral: true });
      }
      const row = confirmRow('confirm_purge_channel', 'cancel_purge_channel', '⚠️ Vider le salon', '↩️ Annuler');
      const reply = await interaction.reply({
        embeds: [warningEmbed('Confirmation', 'Tu vas supprimer et recréer ce salon. **Toute l\'historique sera perdue.** Confirmer ?')],
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });
      const filter = i => i.user.id === interaction.user.id;
      try {
        const btn = await reply.awaitMessageComponent({ filter, time: 15000 });
        if (btn.customId === 'confirm_purge_channel') {
          const ch = interaction.channel;
          const position = ch.position;
          const parent = ch.parentId;
          const name = ch.name;
          const topic = ch.topic;
          const nsfw = ch.nsfw;
          const rateLimitPerUser = ch.rateLimitPerUser;
          const permOverwrites = ch.permissionOverwrites.cache.map(ov => ({
            id: ov.id, allow: ov.allow, deny: ov.deny, type: ov.type,
          }));
          await btn.update({ embeds: [successEmbed('Suppression...', 'Le salon est en cours de recréation.')], components: [] });
          await ch.delete();
          const newCh = await interaction.guild.channels.create({
            name, type: ChannelType.GuildText, topic, nsfw, rateLimitPerUser,
            parent, permissionOverwrites, position,
          });
          await newCh.send({ content: '✅ Salon vidé et recréé avec succès.' });
        } else {
          await btn.update({ embeds: [successEmbed('Annulé', 'Opération annulée.')], components: [] });
        }
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('Timeout', 'Délai dépassé.')], components: [] });
      }
    }
  },
};
