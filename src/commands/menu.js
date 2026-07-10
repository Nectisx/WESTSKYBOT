// src/commands/menu.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildMainMenuEmbed } = require('../embeds/menuEmbed');
const { menuSelectRow } = require('../components/selectMenus');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Afficher le menu principal interactif du bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.reply({
      embeds: [buildMainMenuEmbed()],
      components: [menuSelectRow()],
    });
  },
};
