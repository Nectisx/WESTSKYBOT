// src/commands/moderation/clearwarns.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../embeds/baseEmbed');
const { clearWarnings } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Effacer tous les avertissements d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    await clearWarnings(interaction.guildId, targetUser.id);
    await interaction.reply({ embeds: [successEmbed('Avertissements effacés', `Tous les avertissements de ${targetUser.tag} ont été supprimés.`)], ephemeral: true });
  },
};
