// src/commands/moderation/tempkick.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, hierarchyError, botTargetError } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { canModerate } = require('../../utils/permissions');
const { parseTime, formatDuration } = require('../../utils/timeParser');
const { createTempBan } = require('../../services/tempBanService');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempkick')
    .setDescription('Expulser temporairement un membre (débannissement automatique)')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(opt => opt.setName('durée').setDescription('Durée (ex: 30m, 2h, 1j)').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison de l\'expulsion')),

  async execute(interaction, client) {
    // Vérification des permissions : admin OU rôle modérateur configuré
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      || interaction.guild.ownerId === interaction.user.id;
    const isMod = config?.modRoleId && interaction.member.roles.cache.has(config.modRoleId);

    if (!isAdmin && !isMod) {
      return interaction.reply({
        embeds: [errorEmbed('Permission manquante', 'Tu dois avoir le rôle **Modérateur** pour utiliser cette commande.')],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const dureeStr = interaction.options.getString('durée');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    const durationSeconds = parseTime(dureeStr);
    if (!durationSeconds) {
      return interaction.reply({ embeds: [errorEmbed('Durée invalide', 'Utilise : `30m`, `2h`, `1j`, `1semaine`...')], ephemeral: true });
    }
    if (durationSeconds > 2592000) { // 30 jours max
      return interaction.reply({ embeds: [errorEmbed('Durée trop longue', 'Maximum **30 jours** pour une expulsion temporaire.')], ephemeral: true });
    }

    const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Ce membre n\'est pas sur le serveur.')], ephemeral: true });
    }
    if (target.user.bot) return interaction.reply({ embeds: [botTargetError()], ephemeral: true });

    const check = canModerate(interaction.member, target);
    if (!check.ok) return interaction.reply({ embeds: [hierarchyError()], ephemeral: true });

    await interaction.deferReply();

    try {
      // Prévenir le membre par DM
      await target.user.send({
        content: `⏰ Tu as été temporairement expulsé du serveur **${interaction.guild.name}**.\n**Raison :** ${raison}\n**Durée :** ${formatDuration(durationSeconds)}\nTu pourras revenir dans ${formatDuration(durationSeconds)}.`,
      }).catch(() => {});

      await createTempBan(client, interaction.guild, targetUser, interaction.member, raison, durationSeconds);

      await interaction.editReply({
        embeds: [successEmbed(
          `⏰ ${targetUser.tag} expulsé temporairement`,
          `**Durée :** ${formatDuration(durationSeconds)}\n**Raison :** ${raison}\n**Retour possible :** <t:${Math.floor((Date.now() + durationSeconds * 1000) / 1000)}:R>`,
        )],
      });
    } catch (err) {
      logger.error(`tempkick: ${err.message}`);
      await interaction.editReply({ embeds: [errorEmbed('Erreur', `Impossible d\'expulser : ${err.message}`)] });
    }
  },
};
