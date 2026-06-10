// src/commands/fun/coinflip.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Lancer une pièce')
    .addStringOption(opt => opt.setName('choix').setDescription('Ton choix').addChoices(
      { name: '🦅 Face', value: 'face' },
      { name: '🔵 Pile', value: 'pile' }
    )),

  async execute(interaction) {
    const choice = interaction.options.getString('choix');
    const result = Math.random() < 0.5 ? 'face' : 'pile';
    const won = choice ? choice === result : null;
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(won === null ? COLORS.PRIMARY : won ? COLORS.SUCCESS : COLORS.DANGER)
      .setTitle(`🪙 ${result === 'face' ? '🦅 Face !' : '🔵 Pile !'}`)
      .setDescription(
        choice
          ? (won ? `✅ Tu as choisi **${choice}** et gagné !` : `❌ Tu as choisi **${choice}** mais c\'est **${result}**. Dommage !`)
          : `Le résultat est **${result}** !`
      )
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` });

    await interaction.reply({ embeds: [embed] });
  },
};
