// src/commands/community/profile.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile, xpForLevel, buildXpBar } = require('../../services/levelService');
const { getStats } = require('../../services/inviteService');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Voir le profil complet d\'un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre cible')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const [levelProfile, inviteStats] = await Promise.all([
      getProfile(interaction.guildId, user.id),
      getStats(interaction.guildId, user.id),
    ]);
    const xpNeeded = Math.floor(xpForLevel(levelProfile.level));
    const xpBar = buildXpBar(levelProfile.xp, xpNeeded, 14);
    const score = inviteStats.invites - inviteStats.fake - inviteStats.left + inviteStats.bonus;
    const inventory = Array.isArray(levelProfile.inventory) ? levelProfile.inventory : JSON.parse(levelProfile.inventory || '[]');
    const joinTs = member ? Math.floor(member.joinedTimestamp / 1000) : null;

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : COLORS.PRIMARY)
      .setTitle(`⚔️ Profil de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Niveau', value: `**${levelProfile.level}**`, inline: true },
        { name: '🪙 Pièces d\'or', value: `${levelProfile.balance}`, inline: true },
        { name: '📊 Invitations', value: `${score}`, inline: true },
        { name: `✨ XP — ${levelProfile.xp} / ${xpNeeded}`, value: xpBar, inline: false },
        { name: '📦 Inventaire', value: `${inventory.length} objet(s)`, inline: true },
        { name: '📅 Rejoint le', value: joinTs ? `<t:${joinTs}:D> (<t:${joinTs}:R>)` : 'N/A', inline: true },
      )
      .setFooter({ text: '⚔️ WestSky' })
      .setTimestamp();

    if (levelProfile.minecraftPseudo) {
      embed.addFields({ name: '🎮 Pseudo Minecraft', value: `\`${levelProfile.minecraftPseudo}\``, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
