// src/commands/moderation/warn.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { buildSanctionDM } = require('../../embeds/moderationEmbed');
const { addWarning, getWarnings, deleteWarning, addModLog, sendModLog } = require('../../services/moderationService');
const { LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

const AUTO_TIMEOUT_MS = 60 * 60 * 1000; // 1 heure au 3e avertissement

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
          embeds: [buildSanctionDM('warn', interaction.guild, raison, interaction.user, { warnCount: warnings.length })],
        }).catch(() => {});

        await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} averti`, `**Raison :** ${raison}\n**Total avertissements :** ${warnings.length}/${LIMITS.WARN_BEFORE_BAN}`)] });
        await sendModLog(interaction.guild, 'warn', interaction.member, target, raison, { count: warnings.length });

        // Sanction automatique : timeout 1h au 3e avertissement
        if (warnings.length >= LIMITS.WARN_BEFORE_BAN) {
          const autoReason = `${warnings.length} avertissements atteints`;
          await target.timeout(AUTO_TIMEOUT_MS, autoReason).catch(() => null);
          await addModLog(interaction.guildId, targetUser.id, interaction.client.user.id, 'timeout', `[Auto] ${autoReason}`, 3600);
          await sendModLog(interaction.guild, 'timeout', { id: interaction.client.user.id, tag: 'AutoMod ⚙️' }, target, `[Auto] ${autoReason}`, { duration: '1 heure' });
          await targetUser.send({
            embeds: [buildSanctionDM('timeout', interaction.guild, autoReason, { tag: 'AutoMod ⚙️' }, { duration: '1 heure' })],
          }).catch(() => {});
          await interaction.followUp({
            content: `⏰ **${targetUser.tag}** a atteint **${warnings.length}** avertissements → timeout automatique d'**1 heure** appliqué.`,
          });
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
