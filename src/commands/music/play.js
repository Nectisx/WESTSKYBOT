// src/commands/music/play.js
const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COOLDOWNS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  cooldown: COOLDOWNS.MUSIC,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Jouer une musique ou une URL YouTube')
    .addStringOption(opt => opt.setName('requête').setDescription('Titre ou URL YouTube').setRequired(true)),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ embeds: [errorEmbed('Non connecté', 'Tu dois être dans un salon vocal.')], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const query = interaction.options.getString('requête');
    try {
      await client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      await interaction.editReply({ content: '✅ Recherche et lecture en cours !' });
    } catch (err) {
      logger.error(`play: ${err.message}`);
      await interaction.editReply({ embeds: [errorEmbed('Erreur de lecture', err.message)] });
    }
  },
};
