// src/commands/moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, hierarchyError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { canModerate } = require('../../utils/permissions');
const { addModLog, sendModLog } = require('../../services/moderationService');
const { buildSanctionDM } = require('../../embeds/moderationEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison du bannissement'))
    .addIntegerOption(opt => opt.setName('jours').setDescription('Supprimer les messages des X derniers jours (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [permissionError('Ban Members')], ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const jours = interaction.options.getInteger('jours') ?? 0;

    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')], ephemeral: true });
    }
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });

    const check = canModerate(interaction.member, target);
    if (!check.ok) return interaction.reply({ embeds: [hierarchyError()], ephemeral: true });

    try {
      await target.user.send({ embeds: [buildSanctionDM('ban', interaction.guild, raison, interaction.user)] }).catch(() => {});
      await interaction.guild.members.ban(targetUser.id, { reason: raison, deleteMessageSeconds: jours * 86400 });
      await addModLog(interaction.guildId, targetUser.id, interaction.user.id, 'ban', raison);

      await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} banni`, `**Raison :** ${raison}\n**Messages supprimés :** ${jours} jour(s)`)] });

      await sendModLog(interaction.guild, 'ban', interaction.member, target, raison);
    } catch (err) {
      logger.error(`ban: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', `Impossible de bannir : ${err.message}`)], ephemeral: true });
    }
  },
};
