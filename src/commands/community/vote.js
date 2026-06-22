// src/commands/community/vote.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS } = require('../../config/constants');

// Mets à jour ces URLs avec tes vrais liens de vote
const VOTE_SITES = [
  { label: '⭐ Top Serveurs', url: 'https://www.top-serveurs.net/minecraft/westsky' },
  { label: '⭐ Serveur-Minecraft', url: 'https://serveur-minecraft.org/' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Vote pour le serveur WestSky et soutiens la communauté'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('⭐ Voter pour WestSky')
      .setDescription(
        'En votant pour le serveur tu nous aides à grandir et à accueillir de nouveaux joueurs !\n\n' +
        '**Clique sur les boutons ci-dessous pour voter.**\nMerci pour ton soutien ! 🙏'
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '🎁 Récompenses', value: 'Vote et reçois des récompenses en jeu !', inline: false },
      )
      .setFooter({ text: '⚔️ WestSky • PLAY.WESTSKY.FR' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      ...VOTE_SITES.map(s =>
        new ButtonBuilder().setLabel(s.label).setStyle(ButtonStyle.Link).setURL(s.url)
      )
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
