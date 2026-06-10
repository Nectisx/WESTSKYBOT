// src/commands/music/loop.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getPlayer } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Changer le mode de boucle')
    .addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true).addChoices(
      { name: '❌ Désactivé', value: 'none' },
      { name: '🔂 Piste', value: 'track' },
      { name: '🔁 File complète', value: 'queue' }
    )),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Aucune lecture', 'Aucun lecteur actif.')], ephemeral: true });
    const mode = interaction.options.getString('mode');
    player.setLoop(mode);
    const labels = { none: '❌ Désactivé', track: '🔂 Piste en cours', queue: '🔁 File complète' };
    await interaction.reply({ embeds: [successEmbed('🔁 Boucle', `Mode de boucle : **${labels[mode]}**`)] });
  },
};
