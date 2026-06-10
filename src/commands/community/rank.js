// src/commands/community/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../services/levelService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Classement XP du serveur'),

  async execute(interaction) {
    const entries = await getLeaderboard(interaction.guildId, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`📈 Classement XP — ${interaction.guild.name}`)
      .setDescription(
        entries.length === 0
          ? 'Aucune donnée.'
          : entries.map((e, i) => `${medals[i] || `**${i + 1}.**`} <@${e.userId}> — Niveau **${e.level}** (${e.xp} XP)`).join('\n')
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
