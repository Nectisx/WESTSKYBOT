// src/commands/economy/buy.js
const { SlashCommandBuilder } = require('discord.js');
const { buyItem, getShopItems } = require('../../services/economyService');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Acheter un article du magasin')
    .addStringOption(opt => opt.setName('article').setDescription('Nom ou ID de l\'article').setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('article').toLowerCase();
    const items = await getShopItems(interaction.guildId);
    const item = items.find(i => i.name.toLowerCase().includes(query) || i.id === query);
    if (!item) return interaction.reply({ embeds: [errorEmbed('Article introuvable', 'Cet article n\'existe pas dans le magasin.')], ephemeral: true });
    if (item.stock === 0) return interaction.reply({ embeds: [errorEmbed('Épuisé', 'Cet article est en rupture de stock.')], ephemeral: true });

    try {
      const { item: bought } = await buyItem(interaction.guildId, interaction.user.id, item.id);
      if (bought.roleId) {
        await interaction.member.roles.add(bought.roleId).catch(() => {});
      }
      await interaction.reply({ embeds: [successEmbed('Achat réussi !', `Tu as acheté **${bought.name}** pour **${bought.price} 🪙**.${bought.roleId ? `\nRôle <@&${bought.roleId}> attribué !` : ''}`)] });
    } catch (err) {
      if (err.message === 'Fonds insuffisants') {
        await interaction.reply({ embeds: [errorEmbed('Fonds insuffisants', `Tu n\'as pas assez de pièces d'or pour acheter **${item.name}** (${item.price} 🪙).`)], ephemeral: true });
      } else {
        logger.error(`buy: ${err.message}`);
        await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
      }
    }
  },
};
