// src/commands/info/uptime.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Temps de fonctionnement du bot depuis son dernier démarrage')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const readyAt = interaction.client.readyAt;
    const uptimeMs = Date.now() - readyAt.getTime();
    const d = Math.floor(uptimeMs / 86400000);
    const h = Math.floor((uptimeMs % 86400000) / 3600000);
    const m = Math.floor((uptimeMs % 3600000) / 60000);
    const s = Math.floor((uptimeMs % 60000) / 1000);
    const readyTs = Math.floor(readyAt.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('⏱️ Uptime du bot')
      .setDescription(`En ligne depuis <t:${readyTs}:R>`)
      .addFields(
        { name: '📅 Durée totale', value: `**${d}j ${h}h ${m}m ${s}s**`, inline: true },
        { name: '🚀 Démarré le', value: `<t:${readyTs}:F>`, inline: true },
      )
      .setFooter({ text: '⚔️ WestSky' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
