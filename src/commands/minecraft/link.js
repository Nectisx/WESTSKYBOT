// src/commands/minecraft/link.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { successEmbed } = require('../../embeds/baseEmbed');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Lier ton pseudo Minecraft à ton compte Discord')
    .addStringOption(opt => opt
      .setName('pseudo')
      .setDescription('Ton pseudo Minecraft exact')
      .setRequired(true)
      .setMaxLength(16)
    ),

  async execute(interaction) {
    const pseudo = interaction.options.getString('pseudo').trim();

    if (!/^[a-zA-Z0-9_]{2,16}$/.test(pseudo)) {
      return interaction.reply({ embeds: [errorEmbed('Pseudo invalide', 'Le pseudo Minecraft doit contenir 2 à 16 caractères alphanumériques ou underscores.')], ephemeral: true });
    }

    try {
      await prisma.userProfile.upsert({
        where: { guildId_userId: { guildId: interaction.guildId, userId: interaction.user.id } },
        update: { minecraftPseudo: pseudo },
        create: { guildId: interaction.guildId, userId: interaction.user.id, minecraftPseudo: pseudo },
      });

      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('✅ Pseudo Minecraft lié')
        .setDescription(`Ton pseudo Minecraft **\`${pseudo}\`** a été associé à ton compte Discord.`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 Discord', value: interaction.user.tag, inline: true },
          { name: '🎮 Minecraft', value: `\`${pseudo}\``, inline: true },
        )
        .setFooter({ text: `⚔️ WestSky • ${date}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      logger.error(`link: ${err.message}`);
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
