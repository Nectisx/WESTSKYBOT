// src/commands/moderation/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, permissionError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { addModLog } = require('../../services/moderationService');
const { buildModEmbed } = require('../../embeds/moderationEmbed');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le mute d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à démuter').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [permissionError('Moderate Members')], ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });

    try {
      await target.timeout(null, raison);
      await addModLog(interaction.guildId, targetUser.id, interaction.user.id, 'unmute', raison);
      await interaction.reply({ embeds: [successEmbed(`🔊 ${targetUser.username} démuté`, `**Raison :** ${raison}`)] });

      const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
      if (config?.logChannelId) {
        const logCh = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logCh) await logCh.send({ embeds: [buildModEmbed('unmute', interaction.member, target, raison)] }).catch(() => {});
      }
    } catch (err) {
      logger.error(`unmute: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
