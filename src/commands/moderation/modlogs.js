// src/commands/moderation/modlogs.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getModLogs } = require('../../services/moderationService');
const { COLORS } = require('../../config/constants');

const PAGE_SIZE = 5;
const ACTION_EMOJI = {
  ban: '🔨', tempban: '⏰🔨', kick: '👢', tempkick: '⏰👢',
  mute: '🔇', timeout: '⏰', warn: '⚠️', unmute: '🔊',
  unban: '🔓', softban: '🔨',
};
const ACTION_COLOR = {
  ban: COLORS.DANGER, tempban: COLORS.DANGER, softban: COLORS.DANGER,
  kick: COLORS.DEEP, tempkick: COLORS.DEEP, mute: COLORS.DEEP,
  warn: COLORS.SECONDARY, unmute: COLORS.SUCCESS, unban: COLORS.SUCCESS,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('Voir les logs de modération d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    const logs = await getModLogs(interaction.guildId, targetUser.id, 50);

    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    let page = 0;

    function buildEmbed(p) {
      const slice = logs.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
      const description = slice.length === 0
        ? '✅ Aucun log de modération.'
        : slice.map((l, i) => {
            const num = p * PAGE_SIZE + i + 1;
            const emoji = ACTION_EMOJI[l.action] || '📋';
            const ts = Math.floor(new Date(l.createdAt).getTime() / 1000);
            return `**${num}.** ${emoji} **${l.action.toUpperCase()}** — par <@${l.modId}> — <t:${ts}:R>\n　📝 ${l.reason || 'Aucune raison'}`;
          }).join('\n\n');

      const dominantColor = ACTION_COLOR[slice[0]?.action] || COLORS.DEEP;

      return new EmbedBuilder()
        .setColor(logs.length === 0 ? COLORS.SUCCESS : dominantColor)
        .setTitle(`🛡️ Logs de modération — ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(description)
        .setFooter({ text: `⚔️ WestSky • ${logs.length} action(s) • Page ${p + 1}/${totalPages}` })
        .setTimestamp();
    }

    function buildRow(p) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ml_prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId('ml_page').setLabel(`${p + 1} / ${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('ml_next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(p >= totalPages - 1),
      );
    }

    const reply = await interaction.reply({
      embeds: [buildEmbed(0)],
      components: totalPages > 1 ? [buildRow(0)] : [],
      ephemeral: true,
      fetchReply: true,
    });

    if (totalPages <= 1) return;

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 5 * 60 * 1000,
    });

    collector.on('collect', async i => {
      if (i.customId === 'ml_prev') page = Math.max(0, page - 1);
      if (i.customId === 'ml_next') page = Math.min(totalPages - 1, page + 1);
      await i.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};
