// src/commands/music/skip.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer à la prochaine musique'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || (!player.playing && !player.paused)) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucune musique à passer.')], ephemeral: true });
    const skipped = await player.skip();
    await interaction.reply({ embeds: [successEmbed('⏭️ Passé', `**${skipped?.title || 'Piste'}** a été passée.`)] });
  },
};
