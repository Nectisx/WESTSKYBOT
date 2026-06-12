// src/commands/music/remove.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Supprimer une piste de la file d\'attente')
    .addIntegerOption(opt => opt.setName('position').setDescription('Position dans la file (1 = premier en attente)').setRequired(true).setMinValue(1)),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    const waiting = queue ? queue.songs.length - 1 : 0;
    if (!queue || waiting === 0) return interaction.reply({ embeds: [errorEmbed('File vide', 'La file d\'attente est vide.')], ephemeral: true });
    const pos = interaction.options.getInteger('position');
    if (pos > waiting) {
      return interaction.reply({ embeds: [errorEmbed('Position invalide', `Il n\'y a que **${waiting}** piste(s) en attente.`)], ephemeral: true });
    }
    // songs[0] = current, songs[pos] = waiting track at pos
    const removed = queue.songs[pos];
    queue.songs.splice(pos, 1);
    await interaction.reply({ embeds: [successEmbed('🗑️ Supprimé', `**${removed?.name || 'Piste'}** retiré de la file.`)] });
  },
};
