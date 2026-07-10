// src/commands/admin/level.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getProfile, xpForLevel, buildXpBar } = require('../../services/levelService');
const { updateConfig, getConfig } = require('../../services/configService');
const { successEmbed } = require('../../embeds/baseEmbed');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { COLORS } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Système de niveaux')
    .addSubcommand(sub =>
      sub.setName('level')
        .setDescription('Voir ton niveau et ton XP')
        .addUserOption(opt =>
          opt.setName('utilisateur')
            .setDescription('Membre cible (par défaut : toi)')))
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Définir le salon des annonces de niveau (admin)')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Salon où annoncer les montées de niveau')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver les annonces de niveau (admin)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'level') {
      const user = interaction.options.getUser('utilisateur') || interaction.user;
      const profile = await getProfile(interaction.guildId, user.id);
      const xpNeeded = Math.floor(xpForLevel(profile.level));
      const xpBar = buildXpBar(profile.xp, xpNeeded, 14);

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`⭐ Niveau de ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '⭐ Niveau', value: `**${profile.level}**`, inline: true },
          { name: `✨ XP — ${profile.xp} / ${xpNeeded}`, value: xpBar, inline: false },
        )
        .setFooter({ text: '⚔️ WestSky' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // setup / disable : admin uniquement
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Permission manquante', 'Tu dois être administrateur.')], ephemeral: true });
    }

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('salon');
      const me = interaction.guild.members.me;
      if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
        return interaction.reply({
          embeds: [errorEmbed('Permissions manquantes', `Je ne peux pas écrire dans ${channel}.`)],
          ephemeral: true,
        });
      }
      await updateConfig(interaction.guildId, { levelChannelId: channel.id });
      return interaction.reply({
        embeds: [successEmbed('Système de niveaux configuré', `📈 Les annonces de montée de niveau seront envoyées dans ${channel}.`)],
        ephemeral: true,
      });
    }

    if (sub === 'disable') {
      const config = await getConfig(interaction.guildId);
      if (!config.levelChannelId) {
        return interaction.reply({
          embeds: [errorEmbed('Rien à désactiver', 'Aucun salon d\'annonces de niveau n\'est configuré.')],
          ephemeral: true,
        });
      }
      await updateConfig(interaction.guildId, { levelChannelId: null });
      return interaction.reply({
        embeds: [successEmbed('Annonces désactivées', '📴 Les annonces de montée de niveau sont désactivées.')],
        ephemeral: true,
      });
    }
  },
};
