// src/commands/giveaway/create.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { parseTime, formatDuration } = require('../../utils/timeParser');
const { COOLDOWNS, LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  cooldown: COOLDOWNS.GIVEAWAY,
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Gérer les giveaways du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Créer un nouveau giveaway')
      .addStringOption(opt => opt.setName('durée').setDescription('Durée (ex: 10m, 2h, 3d, 1j)').setRequired(true))
      .addIntegerOption(opt => opt.setName('gagnants').setDescription('Nombre de gagnants').setRequired(true).setMinValue(1).setMaxValue(LIMITS.GIVEAWAY_WINNERS))
      .addStringOption(opt => opt.setName('lot').setDescription('Lot à gagner').setRequired(true))
      .addChannelOption(opt => opt.setName('salon').setDescription('Salon du giveaway').addChannelTypes(ChannelType.GuildText))
      .addRoleOption(opt => opt.setName('role_requis').setDescription('Rôle requis pour participer'))
      .addRoleOption(opt => opt.setName('role_bonus').setDescription('Rôle qui donne des tickets bonus'))
      .addIntegerOption(opt => opt.setName('multiplicateur').setDescription('Multiplicateur pour le rôle bonus').setMinValue(2).setMaxValue(10))
      .addStringOption(opt => opt.setName('message').setDescription('Message personnalisé'))
    )
    .addSubcommand(sub => sub.setName('end').setDescription('Terminer un giveaway').addStringOption(opt => opt.setName('id').setDescription('ID du giveaway').setRequired(true)))
    .addSubcommand(sub => sub.setName('reroll').setDescription('Retirer un gagnant').addStringOption(opt => opt.setName('id').setDescription('ID du giveaway').setRequired(true)).addIntegerOption(opt => opt.setName('nombre').setDescription('Nombre de gagnants').setMinValue(1).setMaxValue(10)))
    .addSubcommand(sub => sub.setName('cancel').setDescription('Annuler un giveaway').addStringOption(opt => opt.setName('id').setDescription('ID du giveaway').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Lister les giveaways actifs'))
    .addSubcommand(sub => sub.setName('info').setDescription('Infos d\'un giveaway').addStringOption(opt => opt.setName('id').setDescription('ID du giveaway').setRequired(true)))
    .addSubcommand(sub => sub.setName('pause').setDescription('Mettre en pause un giveaway').addStringOption(opt => opt.setName('id').setDescription('ID du giveaway').setRequired(true)))
    .addSubcommand(sub => sub.setName('resume').setDescription('Reprendre un giveaway').addStringOption(opt => opt.setName('id').setDescription('ID du giveaway').setRequired(true))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const dureeStr = interaction.options.getString('durée');
        const gagnants = interaction.options.getInteger('gagnants');
        const lot = interaction.options.getString('lot');
        const salon = interaction.options.getChannel('salon') || interaction.channel;
        const roleRequis = interaction.options.getRole('role_requis');
        const roleBonus = interaction.options.getRole('role_bonus');
        const multiplicateur = interaction.options.getInteger('multiplicateur') || 2;
        const message = interaction.options.getString('message');

        const duration = parseTime(dureeStr);
        if (!duration) {
          return interaction.editReply({ embeds: [errorEmbed('Durée invalide', 'Utilise un format valide : `10m`, `2h`, `3d`, `1j`')] });
        }

        const bonusRoles = roleBonus ? [{ roleId: roleBonus.id, multiplier: multiplicateur }] : [];

        const giveaway = await client.giveawayManager.create({
          guildId: interaction.guildId,
          channelId: salon.id,
          prize: lot,
          winnersCount: gagnants,
          duration,
          hostId: interaction.user.id,
          requiredRoleId: roleRequis?.id ?? null,
          bonusRoles,
          customMessage: message,
        });

        await interaction.editReply({
          embeds: [successEmbed('Giveaway créé !', `🎁 Le giveaway **${lot}** a été lancé dans <#${salon.id}> pour **${formatDuration(duration)}**.`)],
        });
      } catch (err) {
        logger.error(`giveaway create: ${err.message}`);
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'end') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('id');
      try {
        const winners = await client.giveawayManager.end(id);
        await interaction.editReply({ embeds: [successEmbed('Giveaway terminé', `Gagnants : ${winners?.map(w => `<@${w}>`).join(', ') || 'Aucun'}`)] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'reroll') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('id');
      const nombre = interaction.options.getInteger('nombre') || 1;
      try {
        const winners = await client.giveawayManager.reroll(id, nombre);
        await interaction.editReply({ embeds: [successEmbed('Reroll effectué', `Nouveau(x) gagnant(s) : ${winners.map(w => `<@${w}>`).join(', ') || 'Aucun'}`)] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'cancel') {
      const id = interaction.options.getString('id');
      const { confirmRow } = require('../../components/buttons');
      const row = confirmRow(`confirm_gaw_cancel_${id}`, `cancel_gaw_cancel_${id}`, '⚠️ Annuler le giveaway', '↩️ Retour');
      const { warningEmbed } = require('../../embeds/baseEmbed');
      const reply = await interaction.reply({
        embeds: [warningEmbed('Confirmation', `Tu vas annuler le giveaway \`${id}\`. Cette action est irréversible.`)],
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });
      const filter = i => i.user.id === interaction.user.id;
      try {
        const btn = await reply.awaitMessageComponent({ filter, time: 15000 });
        if (btn.customId.startsWith('confirm_gaw_cancel_')) {
          await client.giveawayManager.cancel(id);
          await btn.update({ embeds: [successEmbed('Annulé', 'Le giveaway a été annulé.')], components: [] });
        } else {
          await btn.update({ embeds: [successEmbed('Abandonné', 'Annulation abandonnée.')], components: [] });
        }
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('Timeout', 'Délai dépassé.')], components: [] });
      }
      return;
    }

    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const prisma = require('../../database/prisma');
      const list = await prisma.giveaway.findMany({ where: { guildId: interaction.guildId, status: 'active' }, orderBy: { endsAt: 'asc' } });
      if (list.length === 0) {
        return interaction.editReply({ embeds: [errorEmbed('Aucun giveaway', 'Il n\'y a aucun giveaway actif.')] });
      }
      const { EmbedBuilder } = require('discord.js');
      const { COLORS } = require('../../config/constants');
      const { formatTimeRemaining } = require('../../utils/timeParser');
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🎁 Giveaways actifs')
        .setDescription(list.map(g => `**${g.prize}** — <#${g.channelId}> — Se termine dans ${formatTimeRemaining(new Date(g.endsAt))} — ID: \`${g.id}\``).join('\n'))
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'info') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('id');
      const prisma = require('../../database/prisma');
      const giveaway = await prisma.giveaway.findUnique({ where: { id } });
      if (!giveaway) return interaction.editReply({ embeds: [errorEmbed('Introuvable', 'Giveaway non trouvé.')] });
      const count = await prisma.giveawayEntry.count({ where: { giveawayId: id } });
      const { buildGiveawayEmbed } = require('../../embeds/giveawayEmbed');
      const embed = buildGiveawayEmbed(giveaway, count);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'pause') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('id');
      try {
        await client.giveawayManager.pause(id);
        await interaction.editReply({ embeds: [successEmbed('En pause', 'Le giveaway a été mis en pause.')] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
      return;
    }

    if (sub === 'resume') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('id');
      try {
        await client.giveawayManager.resume(id);
        await interaction.editReply({ embeds: [successEmbed('Repris', 'Le giveaway a repris.')] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Erreur', err.message)] });
      }
    }
  },
};
