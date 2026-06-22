// src/commands/info/serveur.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS } = require('../../config/constants');

const SEPARATOR = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serveur')
    .setDescription('Informations sur le serveur Minecraft WestSky'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setAuthor({
        name: 'WestSky — Serveur Minecraft',
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setTitle('⚔️  Bienvenue sur WestSky')
      .setDescription(
        '> Rejoins notre communauté et vis une aventure Minecraft unique.\n' +
        '> Survie, PvP, événements et bien plus encore t\'attendent !\n\n' +
        SEPARATOR
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '🌐  Adresse IP',
          value: '```\nPLAY.WESTSKY.FR\n```',
          inline: false,
        },
        {
          name: '🎮  Mode de jeu',
          value: '```\nSurvie\n```',
          inline: true,
        },
        {
          name: '📦  Version',
          value: '```\n1.21.11\n```',
          inline: true,
        },
        {
          name: '​',
          value: '​',
          inline: true,
        },
        {
          name: '💬  Discord',
          value: '```\ndiscord.gg/westsky\n```',
          inline: true,
        },
        {
          name: '🔗  Lien direct',
          value: '[Clique ici pour rejoindre](https://discord.gg/westsky)',
          inline: true,
        },
        {
          name: '​',
          value: '​',
          inline: true,
        },
        {
          name: '​',
          value: SEPARATOR,
          inline: false,
        },
      )
      .setImage('https://i.imgur.com/00000000.png') // Optionnel : bannière du serveur
      .setFooter({
        text: '⚔️ WestSky  •  PLAY.WESTSKY.FR  •  1.21.11',
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    // Supprimer le champ image si pas de bannière définie
    embed.data.image = undefined;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('💬  Rejoindre le Discord')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/westsky'),
      new ButtonBuilder()
        .setLabel('🌐  Copier l\'IP')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('copy_ip')
        .setDisabled(false),
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    // Collecteur pour le bouton "Copier l'IP" (éphémère)
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'copy_ip',
      time: 120_000,
    });

    collector.on('collect', async i => {
      await i.reply({
        content: '📋 **Adresse IP copiée :** `PLAY.WESTSKY.FR`\nColle-la directement dans ton client Minecraft !',
        ephemeral: true,
      });
    });
  },
};
