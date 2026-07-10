// src/commands/admin/level.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile, xpForLevel, buildXpBar } = require('../../services/levelService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Voir ton niveau et ton XP')
    .addUserOption(opt =>
      opt.setName('utilisateur')
        .setDescription('Membre cible (par défaut : toi)')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const profile = await getProfile(interaction.guildId, user.id);
    const xpNeeded = Math.floor(xpForLevel(profile.level));
    const xpBar = buildXpBar(profile.xp, xpNeeded, 14);

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`⭐ Niveau de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Niveau', value: `**${profile.level}**`, inline: true },
        { name: `✨ XP — ${profile.xp} / ${xpNeeded}`, value: xpBar, inline: false },
      )
      .setFooter({ text: '⚔️ WestSky' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
