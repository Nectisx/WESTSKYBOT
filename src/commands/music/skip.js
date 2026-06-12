// src/commands/music/skip.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer à la prochaine musique'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique à passer.')], ephemeral: true });
    const current = queue.songs[0];
    try {
      await client.distube.skip(interaction.guild);
      await interaction.reply({ embeds: [successEmbed('⏭️ Passé', `**${current?.name || 'Piste'}** passée.`)] });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true });
    }
  },
};
