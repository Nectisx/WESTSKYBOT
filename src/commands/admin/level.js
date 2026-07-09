// src/commands/admin/level.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateConfig, getConfig } = require('../../services/configService');
const { successEmbed } = require('../../embeds/baseEmbed');
const { errorEmbed } = require('../../embeds/errorEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Gestion du système de niveaux')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Définir le salon des annonces de niveau')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Salon où annoncer les montées de niveau')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver les annonces de niveau')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('salon');

      const me = interaction.guild.members.me;
      if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
        return interaction.reply({
          embeds: [errorEmbed('Permissions manquantes', `Je ne peux pas écrire dans ${channel}. Vérifie mes permissions sur ce salon.`)],
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
