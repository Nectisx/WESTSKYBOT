// src/commands/music/play.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { getOrCreatePlayer } = require('../../services/musicService');
const { COOLDOWNS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  cooldown: COOLDOWNS.MUSIC,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Jouer une musique ou une URL YouTube')
    .addStringOption(opt => opt.setName('requête').setDescription('Titre ou URL YouTube').setRequired(true)),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ embeds: [errorEmbed('Non connecté', 'Tu dois être dans un salon vocal.')], ephemeral: true });
    }
    await interaction.deferReply();
    const query = interaction.options.getString('requête');
    try {
      const player = getOrCreatePlayer(interaction.guildId);
      player.textChannel = interaction.channel;
      await player.join(voiceChannel);
      const track = await player.play(query, interaction.user.id);
      const { buildNowPlayingEmbed } = require('../../embeds/musicEmbed');
      const embed = buildNowPlayingEmbed(track, player);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error(`play: ${err.message}`);
      await interaction.editReply({ embeds: [errorEmbed('Erreur de lecture', err.message)] });
    }
  },
};
