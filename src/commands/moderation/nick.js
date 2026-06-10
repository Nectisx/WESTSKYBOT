// src/commands/moderation/nick.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Changer le surnom d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    .addStringOption(opt => opt.setName('surnom').setDescription('Nouveau surnom (vide pour réinitialiser)')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({ embeds: [permissionError('Manage Nicknames')], ephemeral: true });
    }
    const targetUser = interaction.options.getUser('utilisateur');
    const surnom = interaction.options.getString('surnom') || null;
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    try {
      await target.setNickname(surnom);
      const msg = surnom ? `Surnom de ${targetUser.tag} changé en **${surnom}**` : `Surnom de ${targetUser.tag} réinitialisé.`;
      await interaction.reply({ embeds: [successEmbed('📝 Surnom modifié', msg)] });
    } catch (err) {
      logger.error(`nick: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
