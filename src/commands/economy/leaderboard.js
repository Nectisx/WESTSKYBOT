// src/commands/economy/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalanceLeaderboard } = require('../../services/economyService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('richest')
    .setDescription('Classement des membres les plus riches'),

  async execute(interaction) {
    const entries = await getBalanceLeaderboard(interaction.guildId, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.ACCENT)
      .setTitle(`🪙 Classement des fortunes — ${interaction.guild.name}`)
      .setDescription(
        entries.length === 0
          ? 'Aucune donnée.'
          : entries.map((e, i) => `${medals[i] || `**${i + 1}.**`} <@${e.userId}> — **${e.balance} 🪙**`).join('\n')
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
