// src/commands/economy/shop.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getShopItems } = require('../../services/economyService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Voir le magasin du serveur'),

  async execute(interaction) {
    const items = await getShopItems(interaction.guildId);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🛒 Magasin du Royaume')
      .setDescription(
        items.length === 0
          ? 'Le magasin est vide pour le moment.'
          : items.map(item =>
            `${item.emoji} **${item.name}** — \`${item.price} 🪙\`\n└ ${item.description}${item.stock > 0 ? ` — Stock: ${item.stock}` : item.stock === 0 ? ' — **Épuisé**' : ''}`
          ).join('\n\n')
      )
      .setFooter({ text: `⚔️ SOLARA • ${date} • Utilise /buy pour acheter` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
