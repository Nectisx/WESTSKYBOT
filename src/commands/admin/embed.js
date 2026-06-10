// src/commands/admin/embed.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { embedModal } = require('../../components/modals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Créer un embed personnalisé')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [permissionError('Manage Messages')], ephemeral: true });
    }
    const modal = embedModal();
    await interaction.showModal(modal);
  },
};
