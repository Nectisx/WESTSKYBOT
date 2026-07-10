// src/commands/community/rankconfig.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getLeaderboard, buildLeaderboardEmbed } = require('../../services/levelService');
const prisma = require('../../database/prisma');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rankconfig')
    .setDescription('Configurer le classement XP')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Configurer le salon du classement auto-actualisé')
      .addChannelOption(opt => opt
        .setName('salon')
        .setDescription('Salon où afficher le classement en live')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
      )
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');
    await interaction.deferReply({ ephemeral: true });

    try {
      const entries = await getLeaderboard(interaction.guildId, 10);
      const embed = buildLeaderboardEmbed(
        entries,
        interaction.guild.name,
        interaction.guild.iconURL({ dynamic: true }),
      );

      const msg = await channel.send({ embeds: [embed] });

      await prisma.guildConfig.upsert({
        where: { guildId: interaction.guildId },
        update: { rankChannelId: channel.id, rankMessageId: msg.id },
        create: { guildId: interaction.guildId, rankChannelId: channel.id, rankMessageId: msg.id },
      });

      await interaction.editReply({ content: `✅ Classement configuré dans ${channel} ! Il se met à jour automatiquement dès que des membres gagnent de l'XP.` });
      logger.info(`[Rank] Classement configuré dans #${channel.name} par ${interaction.user.tag}`);
    } catch (err) {
      logger.error(`[Rank setup] ${err.message}`);
      await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  },
};
