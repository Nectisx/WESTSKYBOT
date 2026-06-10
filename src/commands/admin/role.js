// src/commands/admin/role.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Gérer les rôles d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter un rôle')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
      .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à ajouter').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Retirer un rôle')
      .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
      .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à retirer').setRequired(true))
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ embeds: [permissionError('Manage Roles')], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('utilisateur');
    const role = interaction.options.getRole('rôle');
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    if (role.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('Hiérarchie invalide', 'Tu ne peux pas gérer ce rôle.')], ephemeral: true });
    }
    try {
      if (sub === 'add') {
        await target.roles.add(role);
        await interaction.reply({ embeds: [successEmbed('Rôle ajouté', `<@&${role.id}> ajouté à ${targetUser.tag}.`)] });
      } else {
        await target.roles.remove(role);
        await interaction.reply({ embeds: [successEmbed('Rôle retiré', `<@&${role.id}> retiré à ${targetUser.tag}.`)] });
      }
    } catch (err) {
      logger.error(`role: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
