// src/commands/moderation/tempban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, hierarchyError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { canModerate } = require('../../utils/permissions');
const { parseTime, formatDuration } = require('../../utils/timeParser');
const { createTempBan } = require('../../services/tempBanService');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Bannir temporairement un membre (débannissement automatique)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(opt => opt.setName('durée').setDescription('Durée (ex: 1h, 1j, 7j)').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison du bannissement')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu as besoin de la permission **Bannir des membres**.')], ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const dureeStr = interaction.options.getString('durée');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    const durationSeconds = parseTime(dureeStr);
    if (!durationSeconds) {
      return interaction.reply({ embeds: [errorEmbed('Durée invalide', 'Utilise : `1h`, `1j`, `7j`, `30j`...')], ephemeral: true });
    }
    if (durationSeconds > 2592000) {
      return interaction.reply({ embeds: [errorEmbed('Durée trop longue', 'Maximum **30 jours** pour un ban temporaire.')], ephemeral: true });
    }

    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Ce membre n\'est pas sur le serveur.')], ephemeral: true });
    }
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });

    const check = canModerate(interaction.member, target);
    if (!check.ok) return interaction.reply({ embeds: [hierarchyError()], ephemeral: true });

    await interaction.deferReply();

    try {
      await target.user.send({
        content: `⏰🔨 Tu as été banni temporairement du serveur **${interaction.guild.name}**.\n**Raison :** ${raison}\n**Durée :** ${formatDuration(durationSeconds)}\nTu seras débanni automatiquement dans ${formatDuration(durationSeconds)}.`,
      }).catch(() => {});

      await createTempBan(client, interaction.guild, targetUser, interaction.member, raison, durationSeconds, 'tempban');

      await interaction.editReply({
        embeds: [successEmbed(
          `⏰ ${targetUser.tag} banni temporairement`,
          `**Durée :** ${formatDuration(durationSeconds)}\n**Raison :** ${raison}\n**Débannissement :** <t:${Math.floor((Date.now() + durationSeconds * 1000) / 1000)}:R>`,
        )],
      });
    } catch (err) {
      logger.error(`tempban: ${err.message}`);
      await interaction.editReply({ embeds: [errorEmbed('Erreur', `Impossible de bannir : ${err.message}`)] });
    }
  },
};
