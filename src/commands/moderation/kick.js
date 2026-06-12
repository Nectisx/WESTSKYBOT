// src/commands/moderation/kick.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError, hierarchyError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { canModerate } = require('../../utils/permissions');
const { addModLog } = require('../../services/moderationService');
const { buildModEmbed } = require('../../embeds/moderationEmbed');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison de l\'expulsion')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ embeds: [permissionError('Kick Members')], ephemeral: true });
    }
    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });
    const check = canModerate(interaction.member, target);
    if (!check.ok) return interaction.reply({ embeds: [hierarchyError()], ephemeral: true });

    try {
      await target.user.send({ content: `👢 Tu as été expulsé du serveur **${interaction.guild.name}** pour : ${raison}` }).catch(() => {});
      await target.kick(raison);
      await addModLog(interaction.guildId, targetUser.id, interaction.user.id, 'kick', raison);
      await interaction.reply({ embeds: [successEmbed(`${targetUser.tag} expulsé`, `**Raison :** ${raison}`)] });

      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      if (config?.logChannelId) {
        const logCh = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logCh) await logCh.send({ embeds: [buildModEmbed('kick', interaction.member, target, raison)] }).catch(() => {});
      }
    } catch (err) {
      logger.error(`kick: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
