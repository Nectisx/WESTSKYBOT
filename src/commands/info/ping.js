// src/commands/info/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot et de l\'API Discord'),

  async execute(interaction) {
    await interaction.deferReply();
    const reply = await interaction.fetchReply();
    const botLatency = reply.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const getStatus = ms => ms < 100 ? '🟢 Excellent' : ms < 250 ? '🟡 Correct' : '🔴 Élevé';
    const color = botLatency < 100 ? COLORS.SUCCESS : botLatency < 250 ? COLORS.PRIMARY : COLORS.DANGER;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🏓 Pong !')
      .addFields(
        { name: '⚡ Latence Bot', value: `**${botLatency}ms** — ${getStatus(botLatency)}`, inline: true },
        { name: '📡 API Discord', value: `**${apiLatency}ms** — ${getStatus(apiLatency)}`, inline: true },
      )
      .setFooter({ text: '⚔️ WestSky' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
