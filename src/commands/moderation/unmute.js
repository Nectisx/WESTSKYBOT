// src/commands/moderation/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { addModLog } = require('../../services/moderationService');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Démuter un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à démuter').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ embeds: [permissionError('Manage Roles')], ephemeral: true });
    }
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config?.muteRoleId) return interaction.reply({ embeds: [errorEmbed('Rôle mute non configuré', 'Utilise `/config set` pour définir un rôle mute.')], ephemeral: true });
    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    try {
      await target.roles.remove(config.muteRoleId, raison);
      await addModLog(interaction.guildId, targetUser.id, interaction.user.id, 'unmute', raison);
      await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} démuté`, `**Raison :** ${raison}`)] });
    } catch (err) {
      logger.error(`unmute: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
