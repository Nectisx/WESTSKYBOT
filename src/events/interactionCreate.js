// src/events/interactionCreate.js
const { InteractionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const { errorEmbed, cooldownError } = require('../embeds/errorEmbed');
const { checkCooldown } = require('../utils/cooldown');
const { COOLDOWNS, COLORS } = require('../config/constants');
const { buildGiveawayEmbed } = require('../embeds/giveawayEmbed');
const { giveawayRow, participantsNavRow } = require('../components/buttons');
const prisma = require('../database/prisma');

const PARTICIPANTS_PER_PAGE = 10;

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const cooldownMs = command.cooldown ?? COOLDOWNS.DEFAULT;
      const remaining = checkCooldown(interaction.commandName, interaction.user.id, cooldownMs);
      if (remaining > 0) {
        return interaction.reply({ embeds: [cooldownError(remaining)], ephemeral: true });
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        logger.error(`Erreur commande ${interaction.commandName}: ${err.message}`);
        const errEmbed = errorEmbed('Erreur inattendue', 'Une erreur est survenue lors de l\'exécution de la commande.');
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // Boutons
    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('giveaway_join_')) {
        const giveawayId = customId.replace('giveaway_join_', '');
        await handleGiveawayJoin(interaction, giveawayId, client);
        return;
      }

      if (customId.startsWith('giveaway_leave_')) {
        const giveawayId = customId.replace('giveaway_leave_', '');
        await handleGiveawayLeave(interaction, giveawayId, client);
        return;
      }

      if (customId.startsWith('giveaway_info_')) {
        const giveawayId = customId.replace('giveaway_info_', '');
        await handleGiveawayInfo(interaction, giveawayId);
        return;
      }

      // Liste des participants (page initiale et navigation)
      if (customId.startsWith('giveaway_participants_')) {
        const parts = customId.replace('giveaway_participants_', '').split('_');
        const page = parseInt(parts.pop(), 10) || 0;
        const giveawayId = parts.join('_');
        await handleGiveawayParticipants(interaction, giveawayId, page);
        return;
      }

      if (customId.startsWith('giveaway_part_prev_')) {
        const rest = customId.replace('giveaway_part_prev_', '');
        const parts = rest.split('_');
        const currentPage = parseInt(parts.pop(), 10) || 0;
        const giveawayId = parts.join('_');
        await handleGiveawayParticipants(interaction, giveawayId, Math.max(0, currentPage - 1));
        return;
      }

      if (customId.startsWith('giveaway_part_next_')) {
        const rest = customId.replace('giveaway_part_next_', '');
        const parts = rest.split('_');
        const currentPage = parseInt(parts.pop(), 10) || 0;
        const giveawayId = parts.join('_');
        await handleGiveawayParticipants(interaction, giveawayId, currentPage + 1);
        return;
      }

      if (customId === 'accept_rules') {
        await handleAcceptRules(interaction);
        return;
      }

      if (customId === 'ticket_close') {
        await handleTicketClose(interaction);
        return;
      }

      return;
    }

    // Select menus
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'main_menu_select') {
        const { buildCategoryEmbed } = require('../embeds/menuEmbed');
        const selected = interaction.values[0];
        const embed = buildCategoryEmbed(selected);
        if (embed) {
          await interaction.update({ embeds: [embed] }).catch(() => {});
        }
        return;
      }
    }

    // Modals
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === 'modal_create_embed') {
        await handleEmbedModal(interaction);
        return;
      }
    }
  },
};

// Met à jour l'embed du giveaway dans le salon
async function refreshGiveawayEmbed(client, giveaway) {
  try {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;
    const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!msg) return;
    const count = await prisma.giveawayEntry.count({ where: { giveawayId: giveaway.id } });
    const embed = buildGiveawayEmbed(giveaway, count);
    const row = giveawayRow(giveaway.id);
    await msg.edit({ embeds: [embed], components: [row] }).catch(() => {});
  } catch (err) {
    logger.error(`refreshGiveawayEmbed: ${err.message}`);
  }
}

async function handleGiveawayJoin(interaction, giveawayId, client) {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.status !== 'active') {
      return interaction.reply({ embeds: [errorEmbed('Giveaway invalide', 'Ce giveaway n\'est plus actif.')], ephemeral: true });
    }

    if (giveaway.requiredRoleId && !interaction.member.roles.cache.has(giveaway.requiredRoleId)) {
      return interaction.reply({ embeds: [errorEmbed('Rôle requis', `Tu dois avoir le rôle <@&${giveaway.requiredRoleId}> pour participer.`)], ephemeral: true });
    }

    const existing = await prisma.giveawayEntry.findUnique({
      where: { giveawayId_userId: { giveawayId, userId: interaction.user.id } },
    });
    if (existing) {
      return interaction.reply({ embeds: [errorEmbed('Déjà inscrit', 'Tu participes déjà à ce giveaway.')], ephemeral: true });
    }

    const bonusRoles = typeof giveaway.bonusRoles === 'string'
      ? JSON.parse(giveaway.bonusRoles)
      : giveaway.bonusRoles;

    let tickets = 1;
    for (const bonus of (bonusRoles || [])) {
      if (interaction.member.roles.cache.has(bonus.roleId)) {
        tickets = Math.max(tickets, bonus.multiplier);
      }
    }

    await prisma.giveawayEntry.create({ data: { giveawayId, userId: interaction.user.id, tickets } });

    // Mise à jour immédiate de l'embed
    await refreshGiveawayEmbed(client, giveaway);

    await interaction.reply({ content: `✅ Tu participes au giveaway **${giveaway.prize}** avec **${tickets}** ticket(s) !`, ephemeral: true });
  } catch (err) {
    logger.error(`handleGiveawayJoin: ${err.message}`);
    await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true }).catch(() => {});
  }
}

async function handleGiveawayLeave(interaction, giveawayId, client) {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway) {
      return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Giveaway introuvable.')], ephemeral: true });
    }

    const deleted = await prisma.giveawayEntry.deleteMany({
      where: { giveawayId, userId: interaction.user.id },
    });
    if (deleted.count === 0) {
      return interaction.reply({ embeds: [errorEmbed('Non inscrit', 'Tu ne participais pas à ce giveaway.')], ephemeral: true });
    }

    // Mise à jour immédiate de l'embed
    if (giveaway.status === 'active') await refreshGiveawayEmbed(client, giveaway);

    await interaction.reply({ content: '👋 Tu t\'es retiré du giveaway.', ephemeral: true });
  } catch (err) {
    logger.error(`handleGiveawayLeave: ${err.message}`);
    await interaction.reply({ embeds: [errorEmbed('Erreur', err.message)], ephemeral: true }).catch(() => {});
  }
}

async function handleGiveawayInfo(interaction, giveawayId) {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway) return interaction.reply({ content: 'Giveaway introuvable.', ephemeral: true });

    const entry = await prisma.giveawayEntry.findUnique({
      where: { giveawayId_userId: { giveawayId, userId: interaction.user.id } },
    });
    const total = await prisma.giveawayEntry.count({ where: { giveawayId } });
    const tickets = entry ? entry.tickets : 0;
    const chance = total > 0 && tickets > 0
      ? ((tickets / total) * 100 * giveaway.winnersCount).toFixed(2)
      : '0.00';

    await interaction.reply({
      content: entry
        ? `📊 Tu participes avec **${tickets}** ticket(s) — chance estimée : **${chance}%** (${total} participants)`
        : '❌ Tu ne participes pas à ce giveaway.',
      ephemeral: true,
    });
  } catch (err) {
    logger.error(`handleGiveawayInfo: ${err.message}`);
    await interaction.reply({ content: 'Erreur.', ephemeral: true }).catch(() => {});
  }
}

async function handleGiveawayParticipants(interaction, giveawayId, page) {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway) {
      return interaction.reply({ content: 'Giveaway introuvable.', ephemeral: true });
    }

    const total = await prisma.giveawayEntry.count({ where: { giveawayId } });

    if (total === 0) {
      return interaction.reply({ content: '👥 Aucun participant pour le moment.', ephemeral: true });
    }

    const totalPages = Math.ceil(total / PARTICIPANTS_PER_PAGE);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));

    const entries = await prisma.giveawayEntry.findMany({
      where: { giveawayId },
      orderBy: { joinedAt: 'asc' },
      skip: safePage * PARTICIPANTS_PER_PAGE,
      take: PARTICIPANTS_PER_PAGE,
    });

    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const list = entries.map((e, i) => {
      const rank = safePage * PARTICIPANTS_PER_PAGE + i + 1;
      const ticketBadge = e.tickets > 1 ? ` 🎫×${e.tickets}` : '';
      return `**${rank}.** <@${e.userId}>${ticketBadge}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`👥 Participants — ${giveaway.prize}`)
      .setDescription(list)
      .addFields({ name: '📊 Total', value: `**${total}** participant(s)`, inline: true })
      .setFooter({ text: `⚔️ SOLARA • ${date} • Page ${safePage + 1}/${totalPages}` })
      .setTimestamp();

    const navRow = participantsNavRow(giveawayId, safePage, totalPages);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [navRow] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [embed], components: [navRow], ephemeral: true });
    }
  } catch (err) {
    logger.error(`handleGiveawayParticipants: ${err.message}`);
    const reply = { content: 'Erreur lors du chargement des participants.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}

async function handleAcceptRules(interaction) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config?.rglRoleId) {
      return interaction.reply({ content: '⚠️ Aucun rôle configuré pour le règlement.', ephemeral: true });
    }
    if (interaction.member.roles.cache.has(config.rglRoleId)) {
      return interaction.reply({ content: '✅ Tu as déjà accepté le règlement !', ephemeral: true });
    }
    await interaction.member.roles.add(config.rglRoleId);
    await interaction.reply({ content: '✅ Tu as accepté le règlement ! Bienvenue dans le serveur !', ephemeral: true });

    if (config.logChannelId) {
      const logChannel = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ content: `📜 **${interaction.user.tag}** a accepté le règlement.` }).catch(() => {});
      }
    }
  } catch (err) {
    logger.error(`handleAcceptRules: ${err.message}`);
    await interaction.reply({ content: 'Erreur lors de l\'attribution du rôle.', ephemeral: true }).catch(() => {});
  }
}

async function handleTicketClose(interaction) {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId } });
    if (!ticket) return interaction.reply({ content: 'Ticket introuvable.', ephemeral: true });

    const canClose = ticket.userId === interaction.user.id
      || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
    if (!canClose) {
      return interaction.reply({ content: '❌ Tu ne peux pas fermer ce ticket.', ephemeral: true });
    }

    await prisma.ticket.update({ where: { channelId: interaction.channelId }, data: { status: 'closed', closedAt: new Date() } });
    await interaction.channel.send({ content: '🔒 Ticket fermé. Ce salon sera supprimé dans 5 secondes.' });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  } catch (err) {
    logger.error(`handleTicketClose: ${err.message}`);
    await interaction.reply({ content: 'Erreur fermeture ticket.', ephemeral: true }).catch(() => {});
  }
}

async function handleEmbedModal(interaction) {
  try {
    const title = interaction.fields.getTextInputValue('embed_title');
    const description = interaction.fields.getTextInputValue('embed_description');
    const colorHex = interaction.fields.getTextInputValue('embed_color') || '#FFD618';
    const imageUrl = interaction.fields.getTextInputValue('embed_image') || null;

    const color = parseInt(colorHex.replace('#', ''), 16) || 0xFFD618;
    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color);
    if (imageUrl) embed.setImage(imageUrl);

    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    logger.error(`handleEmbedModal: ${err.message}`);
    await interaction.reply({ content: 'Erreur création embed.', ephemeral: true }).catch(() => {});
  }
}
