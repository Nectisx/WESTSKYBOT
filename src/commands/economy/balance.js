// src/commands/economy/balance.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile } = require('../../services/economyService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Voir son solde de pièces d\'or')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const profile = await getProfile(interaction.guildId, user.id);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.ACCENT)
      .setTitle(`🪙 Solde de ${user.tag}`)
      .setDescription(`**${profile.balance} 🪙 pièces d'or**`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
