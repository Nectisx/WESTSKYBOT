// src/commands/moderation/warn.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { buildModEmbed } = require('../../embeds/moderationEmbed');
const { addWarning, getWarnings, deleteWarning } = require('../../services/moderationService');
const { LIMITS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Gérer les avertissements')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Avertir un membre')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à avertir').setRequired(true))
      .addStringOption(opt => opt.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Supprimer un avertissement par ID')
      .addStringOption(opt => opt.setName('id').setDescription('ID de l\'avertissement (visible dans /warnings)').setRequired(true))
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [permissionError('Manage Messages')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const targetUser = interaction.options.getUser('utilisateur');
      const raison = interaction.options.getString('raison');
      const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
      if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });

      try {
        await addWarning(interaction.guildId, targetUser.id, interaction.user.id, raison);
        const warnings = await getWarnings(interaction.guildId, targetUser.id);
        await targetUser.send({
          content: `⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}** pour : ${raison}\n**Total : ${warnings.length} avertissement(s)**`,
        }).catch(() => {});
        await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} averti`, `**Raison :** ${raison}\n**Total avertissements :** ${warnings.length}`)] });

        if (warnings.length >= LIMITS.WARN_BEFORE_BAN) {
          await interaction.followUp({ content: `⚠️ Ce membre a atteint **${warnings.length}** avertissements !`, ephemeral: true });
        }

        const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
        if (config?.logChannelId) {
          const logCh = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
          if (logCh) await logCh.send({ embeds: [buildModEmbed('warn', interaction.member, target, raison, { count: warnings.length })] }).catch(() => {});
        }
      } catch (err) {
        logger.error(`warn add: ${err.message}`);
        await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
      }
      return;
    }

    if (sub === 'remove') {
      const id = interaction.options.getString('id');
      try {
        await deleteWarning(id);
        await interaction.reply({ embeds: [successEmbed('Avertissement supprimé', `L'avertissement \`${id}\` a été supprimé.`)], ephemeral: true });
      } catch (err) {
        logger.error(`warn remove: ${err.message}`);
        await interaction.reply({ embeds: [errorEmbed('Introuvable', 'Cet ID d\'avertissement n\'existe pas.')], ephemeral: true });
      }
    }
  },
};
