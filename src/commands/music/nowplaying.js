// src/commands/music/nowplaying.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { buildNowPlayingEmbed } = require('../../embeds/musicEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Voir la musique en cours de lecture'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs[0]) {
      return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    }
    const embed = buildNowPlayingEmbed(queue.songs[0], queue);
    await interaction.reply({ embeds: [embed] });
  },
};
