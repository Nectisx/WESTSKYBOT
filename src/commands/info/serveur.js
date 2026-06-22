// src/commands/info/serveur.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serveur')
    .setDescription('Informations sur le serveur Minecraft WestSky'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('⚔️ WestSky — Serveur Minecraft')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription('Rejoins la communauté WestSky et vis une expérience Minecraft unique !')
      .addFields(
        { name: '🌐 Adresse IP', value: '```PLAY.WESTSKY.FR```', inline: false },
        { name: '🎮 Mode de jeu', value: 'Survie', inline: true },
        { name: '📦 Version', value: '1.21.x', inline: true },
        { name: '👥 Discord', value: '[discord.gg/westsky](https://discord.gg/westsky)', inline: true },
      )
      .setFooter({ text: '⚔️ WestSky • PLAY.WESTSKY.FR' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('💬 Rejoindre le Discord')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/westsky'),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
