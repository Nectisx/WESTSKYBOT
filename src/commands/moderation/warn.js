// src/commands/moderation/warn.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { addWarning, getWarnings } = require('../../services/moderationService');
const { LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [permissionError('Manage Messages')], ephemeral: true });
    }
    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison');
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });

    try {
      await addWarning(interaction.guildId, targetUser.id, interaction.user.id, raison);
      const warnings = await getWarnings(interaction.guildId, targetUser.id);
      await targetUser.send({ content: `⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}** pour : ${raison} (${warnings.length} avert. total)` }).catch(() => {});
      await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} averti`, `**Raison :** ${raison}\n**Total avertissements :** ${warnings.length}`)] });

      if (warnings.length >= LIMITS.WARN_BEFORE_BAN) {
        await interaction.followUp({ content: `⚠️ Ce membre a atteint **${warnings.length}** avertissements !`, ephemeral: true });
      }
    } catch (err) {
      logger.error(`warn: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
