// src/commands/moderation/timeout.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, hierarchyError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { canModerate } = require('../../utils/permissions');
const { addModLog } = require('../../services/moderationService');
const { parseTime, formatDuration } = require('../../utils/timeParser');
const { buildModEmbed } = require('../../embeds/moderationEmbed');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Mettre un membre en timeout')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    .addStringOption(opt => opt.setName('durée').setDescription('Durée (ex: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [permissionError('Moderate Members')], ephemeral: true });
    }
    const targetUser = interaction.options.getUser('utilisateur');
    const dureeStr = interaction.options.getString('durée');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const duration = parseTime(dureeStr);
    if (!duration) return interaction.reply({ embeds: [errorEmbed('Durée invalide', 'Utilise : 10m, 1h, 1d')], ephemeral: true });
    if (duration > 2419200) return interaction.reply({ embeds: [errorEmbed('Durée trop longue', 'Maximum 28 jours pour un timeout.')], ephemeral: true });

    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });
    const check = canModerate(interaction.member, target);
    if (!check.ok) return interaction.reply({ embeds: [hierarchyError()], ephemeral: true });

    try {
      await target.timeout(duration * 1000, raison);
      await addModLog(interaction.guildId, targetUser.id, interaction.user.id, 'timeout', raison, duration);
      await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} en timeout`, `**Durée :** ${formatDuration(duration)}\n**Raison :** ${raison}`)] });

      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      if (config?.logChannelId) {
        const logCh = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logCh) await logCh.send({ embeds: [buildModEmbed('timeout', interaction.member, target, raison, { duration: formatDuration(duration) })] }).catch(() => {});
      }
    } catch (err) {
      logger.error(`timeout: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
