// src/commands/info/stats.js
const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const { createEmbed } = require('../../embeds/baseEmbed');
const { formatDuration } = require('../../utils/timeParser');
const { BOT_VERSION } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Statistiques techniques du bot'),

  async execute(interaction) {
    const client = interaction.client;
    const uptimeSeconds = Math.floor(process.uptime());
    const memoryMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    const embed = createEmbed()
      .setTitle('📈 Statistiques du bot')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '🤖 Version', value: `WestSky v${BOT_VERSION}`, inline: true },
        { name: '📚 Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '🟢 Node.js', value: process.version, inline: true },
        { name: '⏱️ Uptime', value: formatDuration(uptimeSeconds), inline: true },
        { name: '🧠 Mémoire', value: `${memoryMb} Mo`, inline: true },
        { name: '📡 Ping API', value: `${Math.round(client.ws.ping)} ms`, inline: true },
        { name: '🏰 Serveurs', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 Membres', value: `${totalMembers}`, inline: true },
        { name: '⚡ Commandes', value: `${client.commands.size}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
