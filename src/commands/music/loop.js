// src/commands/music/loop.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Changer le mode de boucle')
    .addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true).addChoices(
      { name: '❌ Désactivé', value: '0' },
      { name: '🔂 Piste en cours', value: '1' },
      { name: '🔁 File complète', value: '2' },
    )),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucun lecteur actif.')], ephemeral: true });
    const mode = parseInt(interaction.options.getString('mode'), 10);
    client.distube.setRepeatMode(interaction.guild, mode);
    const labels = { 0: '❌ Désactivé', 1: '🔂 Piste en cours', 2: '🔁 File complète' };
    await interaction.reply({ embeds: [successEmbed('🔁 Boucle', `Mode de boucle : **${labels[mode]}**`)] });
  },
};
