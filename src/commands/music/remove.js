// src/commands/music/remove.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Supprimer une piste de la file d\'attente')
    .addIntegerOption(opt => opt.setName('position').setDescription('Position dans la file (1 = premier)').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player || player.queue.size === 0) return interaction.reply({ embeds: [errorEmbed('File vide', 'La file d\'attente est vide.')], ephemeral: true });
    const pos = interaction.options.getInteger('position') - 1;
    const removed = player.remove(pos);
    if (!removed) return interaction.reply({ embeds: [errorEmbed('Position invalide', `Il n\'y a que ${player.queue.size} piste(s).`)], ephemeral: true });
    await interaction.reply({ embeds: [successEmbed('🗑️ Supprimé', `**${removed.title}** a été retiré de la file.`)] });
  },
};
