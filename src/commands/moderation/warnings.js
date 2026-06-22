// src/commands/moderation/warnings.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getWarnings } = require('../../services/moderationService');
const { COLORS } = require('../../config/constants');

const PAGE_SIZE = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Voir les avertissements d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur');
    const warns = await getWarnings(interaction.guildId, targetUser.id);

    const totalPages = Math.max(1, Math.ceil(warns.length / PAGE_SIZE));
    let page = 0;

    function buildEmbed(p) {
      const slice = warns.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
      const description = slice.length === 0
        ? '✅ Aucun avertissement.'
        : slice.map((w, i) => {
            const num = p * PAGE_SIZE + i + 1;
            const ts = Math.floor(new Date(w.createdAt).getTime() / 1000);
            return `**${num}.** ${w.reason} — par <@${w.modId}> — <t:${ts}:R>\n> ID : \`${w.id}\``;
          }).join('\n');

      return new EmbedBuilder()
        .setColor(warns.length === 0 ? COLORS.SUCCESS : COLORS.SECONDARY)
        .setTitle(`⚠️ Avertissements — ${targetUser.tag} (${warns.length})`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(description)
        .setFooter({ text: `⚔️ WestSky • Page ${p + 1}/${totalPages} • /warn remove <id> pour supprimer` })
        .setTimestamp();
    }

    function buildRow(p) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('w_prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId('w_page').setLabel(`${p + 1} / ${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('w_next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(p >= totalPages - 1),
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
      if (i.customId === 'w_prev') page = Math.max(0, page - 1);
      if (i.customId === 'w_next') page = Math.min(totalPages - 1, page + 1);
      await i.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};
