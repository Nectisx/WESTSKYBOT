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
  );
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

module.exports = { confirmRow, giveawayRow, acceptRulesRow, ticketCloseRow };
