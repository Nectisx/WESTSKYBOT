// src/commands/admin/config.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { errorEmbed } = require('../../embeds/errorEmbed');
const { successEmbed } = require('../../embeds/baseEmbed');
const { getConfig, updateConfig } = require('../../services/configService');
const { getRolePermissions, setRolePermissions, clearRolePermissions, getAllRolePermissions } = require('../../services/rolePermissionService');
const ROLE_COMMANDS = require('../../config/roleCommands');
const { COLORS } = require('../../config/constants');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurer le bot pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // ── Groupe param ──────────────────────────────────────────────
    .addSubcommandGroup(group => group
      .setName('param')
      .setDescription('Paramètres généraux du bot')
      .addSubcommand(sub => sub.setName('view').setDescription('Voir la configuration actuelle'))
      .addSubcommand(sub => sub
        .setName('set')
        .setDescription('Modifier un paramètre')
        .addStringOption(opt => opt.setName('option').setDescription('Option à modifier').setRequired(true).addChoices(
          { name: 'Salon de logs',      value: 'log_channel' },
          { name: 'Salon de bienvenue', value: 'welcome_channel' },
          { name: 'Rôle membre auto',   value: 'member_role' },
          { name: 'Rôle modérateur',    value: 'mod_role' },
          { name: 'Rôle mute',          value: 'mute_role' },
          { name: 'Catégorie tickets',  value: 'ticket_category' },
          { name: 'Salon suggestions',  value: 'suggestion_channel' },
          { name: 'Salon signalements', value: 'report_channel' },
        ))
        .addChannelOption(opt => opt.setName('salon').setDescription('Salon cible'))
        .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle cible'))
      )
      .addSubcommand(sub => sub.setName('reset').setDescription('Réinitialiser toute la configuration'))
    )

    // ── Groupe role ───────────────────────────────────────────────
    .addSubcommandGroup(group => group
      .setName('role')
      .setDescription('Gérer les permissions des rôles')
      .addSubcommand(sub => sub
        .setName('set')
        .setDescription('Définir les commandes accessibles pour un rôle')
        .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à configurer').setRequired(true))
      )
      .addSubcommand(sub => sub
        .setName('view')
        .setDescription('Voir les commandes d\'un rôle')
        .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à consulter').setRequired(true))
      )
      .addSubcommand(sub => sub
        .setName('list')
        .setDescription('Lister tous les rôles configurés')
      )
      .addSubcommand(sub => sub
        .setName('clear')
        .setDescription('Supprimer toutes les permissions d\'un rôle')
        .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à réinitialiser').setRequired(true))
      )
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();
    const date  = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ══════════════════════════════════════════════════════════════
    // GROUPE PARAM
    // ══════════════════════════════════════════════════════════════
    if (group === 'param') {

      if (sub === 'view') {
        const config = await getConfig(interaction.guildId);
        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('⚙️ Configuration du serveur')
          .addFields(
            { name: '📋 Logs',            value: config.logChannelId        ? `<#${config.logChannelId}>`        : 'Non configuré', inline: true },
            { name: '👋 Bienvenue',        value: config.welcomeChannelId    ? `<#${config.welcomeChannelId}>`    : 'Non configuré', inline: true },
            { name: '🎭 Rôle membre',      value: config.memberRoleId        ? `<@&${config.memberRoleId}>`       : 'Non configuré', inline: true },
            { name: '🛡️ Rôle mod',        value: config.modRoleId           ? `<@&${config.modRoleId}>`          : 'Non configuré', inline: true },
            { name: '🔇 Rôle mute',        value: config.muteRoleId          ? `<@&${config.muteRoleId}>`         : 'Non configuré', inline: true },
            { name: '🎫 Catégorie tickets',value: config.ticketCategoryId    ? `<#${config.ticketCategoryId}>`   : 'Non configuré', inline: true },
            { name: '💡 Suggestions',      value: config.suggestionChannelId ? `<#${config.suggestionChannelId}>`: 'Non configuré', inline: true },
            { name: '🚨 Signalements',     value: config.reportChannelId     ? `<#${config.reportChannelId}>`    : 'Non configuré', inline: true },
          )
          .setFooter({ text: `⚔️ WestSky • ${date}` });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (sub === 'set') {
        const option = interaction.options.getString('option');
        const salon  = interaction.options.getChannel('salon');
        const role   = interaction.options.getRole('rôle');

        const roleOptions    = ['mod_role', 'member_role', 'mute_role'];
        const channelOptions = ['log_channel', 'welcome_channel', 'ticket_category', 'suggestion_channel', 'report_channel'];

        if (roleOptions.includes(option) && !role)
          return interaction.reply({ embeds: [errorEmbed('Rôle requis', `**${option}** nécessite un rôle, pas un salon.`)], ephemeral: true });
        if (channelOptions.includes(option) && !salon)
          return interaction.reply({ embeds: [errorEmbed('Salon requis', `**${option}** nécessite un salon, pas un rôle.`)], ephemeral: true });

        const value = salon?.id || role?.id;
        if (!value) return interaction.reply({ embeds: [errorEmbed('Valeur manquante', 'Fournis un salon ou un rôle.')], ephemeral: true });

        const mapping = {
          log_channel:        'logChannelId',
          welcome_channel:    'welcomeChannelId',
          member_role:        'memberRoleId',
          mod_role:           'modRoleId',
          mute_role:          'muteRoleId',
          ticket_category:    'ticketCategoryId',
          suggestion_channel: 'suggestionChannelId',
          report_channel:     'reportChannelId',
        };
        await updateConfig(interaction.guildId, { [mapping[option]]: value });
        return interaction.reply({ embeds: [successEmbed('Configuration mise à jour', `**${option}** défini sur ${salon ? `<#${salon.id}>` : `<@&${role.id}>`}`)] });
      }

      if (sub === 'reset') {
        const { confirmRow } = require('../../components/buttons');
        const { warningEmbed } = require('../../embeds/baseEmbed');
        const row = confirmRow('confirm_config_reset', 'cancel_config_reset', '⚠️ Réinitialiser', '↩️ Annuler');
        const reply = await interaction.reply({
          embeds: [warningEmbed('Confirmation', 'Tu vas réinitialiser **toute** la configuration du bot pour ce serveur.')],
          components: [row], ephemeral: true, fetchReply: true,
        });
        try {
          const btn = await reply.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 15000 });
          if (btn.customId === 'confirm_config_reset') {
            const prisma = require('../../database/prisma');
            await prisma.guildConfig.update({
              where: { guildId: interaction.guildId },
              data: {
                logChannelId: null, welcomeChannelId: null, welcomeMessage: null,
                memberRoleId: null, modRoleId: null, adminRoleId: null, muteRoleId: null,
                ticketCategoryId: null, suggestionChannelId: null, reportChannelId: null,
                rglChannelId: null, rglMessageId: null, rglRoleId: null,
              },
            });
            await btn.update({ embeds: [successEmbed('Réinitialisé', 'Configuration réinitialisée.')], components: [] });
          } else {
            await btn.update({ embeds: [successEmbed('Annulé', 'Réinitialisation annulée.')], components: [] });
          }
        } catch {
          await interaction.editReply({ embeds: [errorEmbed('Timeout', 'Délai dépassé.')], components: [] });
        }
        return;
      }
    }

    // ══════════════════════════════════════════════════════════════
    // GROUPE ROLE
    // ══════════════════════════════════════════════════════════════
    if (group === 'role') {

      if (sub === 'set') {
        const role = interaction.options.getRole('rôle');
        const currentPerms = await getRolePermissions(interaction.guildId, role.id);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`config_role_perms_${role.id}`)
          .setPlaceholder('Sélectionne les commandes autorisées...')
          .setMinValues(0)
          .setMaxValues(ROLE_COMMANDS.length)
          .addOptions(ROLE_COMMANDS.map(c => ({
            label: c.label,
            value: c.value,
            description: c.description,
            default: currentPerms.includes(c.value),
          })));

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const reply = await interaction.reply({
          content: `**Permissions pour <@&${role.id}>**\nSélectionne les commandes que ce rôle peut utiliser :`,
          components: [row],
          ephemeral: true,
          fetchReply: true,
        });

        try {
          const collected = await reply.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time: 60000,
          });
          await setRolePermissions(interaction.guildId, role.id, collected.values);
          const names = collected.values.map(v => ROLE_COMMANDS.find(c => c.value === v)?.label || v).join(', ') || 'Aucune';
          await collected.update({
            content: `✅ Permissions mises à jour pour <@&${role.id}> !\n**Commandes autorisées :** ${names}`,
            components: [],
          });
        } catch {
          await interaction.editReply({ content: '❌ Temps écoulé. Relance la commande.', components: [] });
        }
        return;
      }

      if (sub === 'view') {
        const role = interaction.options.getRole('rôle');
        const perms = await getRolePermissions(interaction.guildId, role.id);
        const names = perms.map(v => ROLE_COMMANDS.find(c => c.value === v)?.label || v);

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`🔐 Permissions — ${role.name}`)
          .setDescription(names.length > 0 ? names.join('\n') : 'Aucune permission configurée.')
          .setFooter({ text: `⚔️ WestSky • ${date}` });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (sub === 'list') {
        const all = await getAllRolePermissions(interaction.guildId);
        const lines = all
          .filter(r => JSON.parse(r.commands).length > 0)
          .map(r => {
            const names = JSON.parse(r.commands).map(v => ROLE_COMMANDS.find(c => c.value === v)?.label || v).join(', ');
            return `<@&${r.roleId}> → ${names}`;
          });

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('🔐 Permissions des rôles')
          .setDescription(lines.length > 0 ? lines.join('\n') : 'Aucun rôle configuré.')
          .setFooter({ text: `⚔️ WestSky • ${date}` });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (sub === 'clear') {
        const role = interaction.options.getRole('rôle');
        await clearRolePermissions(interaction.guildId, role.id);
        return interaction.reply({ embeds: [successEmbed('Permissions supprimées', `Toutes les permissions de <@&${role.id}> ont été supprimées.`)], ephemeral: true });
      }
    }
  },
};
