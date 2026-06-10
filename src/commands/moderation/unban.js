// src/commands/moderation/unban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { addModLog } = require('../../services/moderationService');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt => opt.setName('id').setDescription('ID de l\'utilisateur').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [permissionError('Ban Members')], ephemeral: true });
    }
    const userId = interaction.options.getString('id');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    try {
      await interaction.guild.members.unban(userId, raison);
      await addModLog(interaction.guildId, userId, interaction.user.id, 'unban', raison);
      await interaction.reply({ embeds: [successEmbed('Utilisateur débanni', `ID: ${userId}\n**Raison :** ${raison}`)] });
    } catch (err) {
      logger.error(`unban: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', `Impossible de débannir : ${err.message}`)], ephemeral: true });
    }
  },
};
