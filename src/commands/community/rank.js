// src/commands/community/rank.js
const { SlashCommandBuilder } = require('discord.js');
const { getLeaderboard, buildLeaderboardEmbed } = require('../../services/levelService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Classement XP du serveur')
    .addSubcommand(sub => sub
      .setName('top')
      .setDescription('Voir le classement XP du serveur')
    ),

  async execute(interaction) {
    const entries = await getLeaderboard(interaction.guildId, 10);
    const embed = buildLeaderboardEmbed(
      entries,
      interaction.guild.name,
      interaction.guild.iconURL({ dynamic: true }),
    );
    await interaction.reply({ embeds: [embed] });
  },
};
