// src/commands/moderation/softban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, hierarchyError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { canModerate } = require('../../utils/permissions');
const { addModLog } = require('../../services/moderationService');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Soft-ban (ban + unban pour purger les messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [permissionError('Ban Members')], ephemeral: true });
    }
    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });
    const check = canModerate(interaction.member, target);
    if (!check.ok) return interaction.reply({ embeds: [hierarchyError()], ephemeral: true });
    try {
      await interaction.guild.members.ban(targetUser.id, { reason: raison, deleteMessageSeconds: 604800 });
      await interaction.guild.members.unban(targetUser.id, 'Soft-ban — messages purgés');
      await addModLog(interaction.guildId, targetUser.id, interaction.user.id, 'softban', raison);
      await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} soft-banni`, `Messages des 7 derniers jours supprimés.\n**Raison :** ${raison}`)] });
    } catch (err) {
      logger.error(`softban: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
