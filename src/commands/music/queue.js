// src/commands/music/queue.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { buildQueueEmbed } = require('../../embeds/musicEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Voir la file d\'attente'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs[0]) {
      return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique en cours.')], ephemeral: true });
    }
    const embed = buildQueueEmbed(queue, 0);
    await interaction.reply({ embeds: [embed] });
  },
};
