// src/commands/community/level.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile, xpForLevel } = require('../../services/levelService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Voir votre niveau et XP')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const profile = await getProfile(interaction.guildId, user.id);
    const xpNeeded = xpForLevel(profile.level);
    const progress = Math.min(Math.floor((profile.xp / xpNeeded) * 20), 20);
    const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(COLORS.ACCENT)
      .setTitle(`📈 Niveau de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Niveau', value: `${profile.level}`, inline: true },
        { name: '✨ XP', value: `${profile.xp} / ${Math.floor(xpNeeded)}`, inline: true },
        { name: '🪙 Pièces d\'or', value: `${profile.balance}`, inline: true },
        { name: '📊 Progression', value: `\`[${progressBar}]\``, inline: false },
      )
      .setFooter({ text: `⚔️ Fantasy Bot • ${date}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
