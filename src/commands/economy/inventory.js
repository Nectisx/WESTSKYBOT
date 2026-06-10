// src/commands/economy/inventory.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile } = require('../../services/economyService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Voir votre inventaire')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const profile = await getProfile(interaction.guildId, user.id);
    const inventory = Array.isArray(profile.inventory) ? profile.inventory : JSON.parse(profile.inventory || '[]');
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(`🎒 Inventaire de ${user.tag}`)
      .setDescription(
        inventory.length === 0
          ? 'Inventaire vide. Visite la boutique avec `/shop` !'
          : inventory.map((item, i) => `**${i + 1}.** ${item.name} — acheté <t:${Math.floor(new Date(item.boughtAt).getTime() / 1000)}:R>`).join('\n')
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
