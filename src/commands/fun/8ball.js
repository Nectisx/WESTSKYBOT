// src/commands/fun/8ball.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

const responses = [
  { text: 'Oui, absolument !', color: COLORS.SUCCESS },
  { text: 'C\'est certain.', color: COLORS.SUCCESS },
  { text: 'Sans aucun doute.', color: COLORS.SUCCESS },
  { text: 'Oui, définitivement.', color: COLORS.SUCCESS },
  { text: 'Tu peux compter dessus.', color: COLORS.SUCCESS },
  { text: 'Les signes sont favorables.', color: COLORS.ACCENT },
  { text: 'Les perspectives sont bonnes.', color: COLORS.ACCENT },
  { text: 'Tout indique que oui.', color: COLORS.ACCENT },
  { text: 'Réponds-moi plus tard.', color: COLORS.LIGHT },
  { text: 'Je n\'ai pas de réponse maintenant.', color: COLORS.LIGHT },
  { text: 'Ne compte pas dessus.', color: COLORS.DEEP },
  { text: 'Ma réponse est non.', color: COLORS.DANGER },
  { text: 'Les perspectives ne sont pas bonnes.', color: COLORS.DANGER },
  { text: 'Il est très douteux que cela arrive.', color: COLORS.DANGER },
  { text: 'Oublie ça !', color: COLORS.DARK },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Poser une question à la boule magique')
    .addStringOption(opt => opt.setName('question').setDescription('Ta question').setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const response = responses[Math.floor(Math.random() * responses.length)];
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(response.color)
      .setTitle('🎱 Boule Magique')
      .addFields(
        { name: '❓ Question', value: question },
        { name: '🔮 Réponse', value: `**${response.text}**` },
      )
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` });

    await interaction.reply({ embeds: [embed] });
  },
};
