// src/components/selectMenus.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

function menuSelectRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('main_menu_select')
      .setPlaceholder('⚔️ Choisir une catégorie...')
      .addOptions([
        { label: '🎁 Giveaways', description: 'Gérer les giveaways', value: 'giveaway', emoji: '🎁' },
        { label: '🛡️ Modération', description: 'Outils de modération', value: 'moderation', emoji: '🛡️' },
        { label: '👋 Bienvenue', description: 'Configuration bienvenue', value: 'welcome', emoji: '👋' },
        { label: '📊 Invitations', description: 'Suivi des invitations', value: 'invites', emoji: '📊' },
        { label: '📜 Règlement', description: 'Système de règlement', value: 'reglement', emoji: '📜' },
        { label: '⚙️ Administration', description: 'Outils admin avancés', value: 'admin', emoji: '⚙️' },
        { label: '📈 Communauté', description: 'Niveaux, tickets, sondages', value: 'community', emoji: '📈' },
      ])
  );
}

module.exports = { menuSelectRow };
