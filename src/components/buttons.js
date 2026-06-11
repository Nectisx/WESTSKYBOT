// src/components/buttons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function confirmRow(confirmId, cancelId, confirmLabel = '✅ Confirmer', cancelLabel = '❌ Annuler') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(confirmId).setLabel(confirmLabel).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(cancelId).setLabel(cancelLabel).setStyle(ButtonStyle.Danger),
  );
}

function giveawayRow(giveawayId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_join_${giveawayId}`)
      .setLabel('🎁 Participer')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`giveaway_leave_${giveawayId}`)
      .setLabel('🚪 Se retirer')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`giveaway_info_${giveawayId}`)
      .setLabel('📊 Mes chances')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`giveaway_participants_${giveawayId}_0`)
      .setLabel('👥 Participants')
      .setStyle(ButtonStyle.Secondary),
  );
}

function participantsNavRow(giveawayId, page, totalPages) {
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_part_prev_${giveawayId}_${page}`)
      .setLabel('◀ Précédent')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`giveaway_participants_${giveawayId}_${page}`)
      .setLabel(`📄 Page ${page + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`giveaway_part_next_${giveawayId}_${page}`)
      .setLabel('Suivant ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
  return row;
}

function acceptRulesRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('accept_rules')
      .setLabel('✅ J\'accepte le règlement')
      .setStyle(ButtonStyle.Success),
  );
}

function ticketCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('🔒 Fermer le ticket')
      .setStyle(ButtonStyle.Danger),
  );
}

module.exports = { confirmRow, giveawayRow, participantsNavRow, acceptRulesRow, ticketCloseRow };
