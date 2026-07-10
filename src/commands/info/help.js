// src/commands/info/help.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed } = require('../../embeds/baseEmbed');
const { categories } = require('../../embeds/menuEmbed');

// Catégories réservées au staff (masquées pour les membres)
const STAFF_CATEGORIES = ['moderation', 'admin', 'giveaway', 'welcome', 'reglement'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Liste des commandes disponibles')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    const embed = createEmbed()
      .setTitle('❓ Aide — Commandes WestSky')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription('Voici les commandes que tu peux utiliser. Pour un menu interactif : `/menu`');

    for (const [key, cat] of Object.entries(categories)) {
      if (!isStaff && STAFF_CATEGORIES.includes(key)) continue;
      embed.addFields({
        name: cat.label,
        value: cat.commands.map(c => `\`${c.name}\``).join(' • '),
        inline: false,
      });
    }

    // Commandes accessibles à tous, hors menu interactif
    embed.addFields({
      name: '📊 Infos & serveur',
      value: '`/serveur` • `/vote` • `/userinfo` • `/serverinfo` • `/avatar` • `/profile` • `/ping` • `/uptime` • `/stats`',
      inline: false,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
