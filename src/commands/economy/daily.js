// src/commands/economy/daily.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { claimDaily, DAILY_AMOUNT } = require('../../services/economyService');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclamer ta récompense quotidienne'),

  async execute(interaction) {
    try {
      const profile = await claimDaily(interaction.guildId, interaction.user.id);
      const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const embed = new EmbedBuilder()
        .setColor(COLORS.ACCENT)
        .setTitle('🪙 Récompense quotidienne')
        .setDescription(`Tu as reçu **${DAILY_AMOUNT} 🪙 pièces d'or** !\nSolde total : **${profile.balance} 🪙**`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `⚔️ Fantasy Bot • ${date} • Reviens demain !` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      if (err.message.startsWith('Reviens')) {
        await interaction.reply({ embeds: [errorEmbed('Déjà réclamé', `Tu as déjà pris ta récompense. ${err.message}`)], ephemeral: true });
      } else {
        logger.error(`daily: ${err.message}`);
        await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
      }
    }
  },
};
