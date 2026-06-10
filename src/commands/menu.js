// src/commands/menu.js
const { SlashCommandBuilder } = require('discord.js');
const { buildMainMenuEmbed } = require('../embeds/menuEmbed');
const { menuSelectRow } = require('../components/selectMenus');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Ouvrir le menu principal du bot'),

  async execute(interaction) {
    const embed = buildMainMenuEmbed();
    const row = menuSelectRow();
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
