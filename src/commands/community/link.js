// src/commands/community/link.js
const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../database/prisma');
const { successEmbed } = require('../../embeds/baseEmbed');
const { errorEmbed } = require('../../embeds/errorEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Lier ton pseudo Minecraft à ton profil')
    .addStringOption(opt =>
      opt.setName('pseudo')
        .setDescription('Ton pseudo Minecraft')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)),

  async execute(interaction) {
    const pseudo = interaction.options.getString('pseudo').trim();

    if (!/^[A-Za-z0-9_]{3,16}$/.test(pseudo)) {
      return interaction.reply({
        embeds: [errorEmbed('Pseudo invalide', 'Un pseudo Minecraft contient 3 à 16 caractères : lettres, chiffres et `_` uniquement.')],
        ephemeral: true,
      });
    }

    await prisma.userProfile.upsert({
      where: { guildId_userId: { guildId: interaction.guildId, userId: interaction.user.id } },
      update: { minecraftPseudo: pseudo },
      create: { guildId: interaction.guildId, userId: interaction.user.id, minecraftPseudo: pseudo },
    });

    return interaction.reply({
      embeds: [successEmbed('Pseudo lié', `🎮 Ton pseudo Minecraft \`${pseudo}\` est maintenant lié à ton profil.`)],
      ephemeral: true,
    });
  },
};
