// src/utils/pagination.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildPaginationRow(currentPage, totalPages, prefix) {
  const prev = new ButtonBuilder()
    .setCustomId(`${prefix}_prev_${currentPage}`)
    .setLabel('◀ Précédent')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage === 0);

  const info = new ButtonBuilder()
    .setCustomId(`${prefix}_info`)
    .setLabel(`Page ${currentPage + 1}/${totalPages}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  const next = new ButtonBuilder()
    .setCustomId(`${prefix}_next_${currentPage}`)
    .setLabel('Suivant ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage >= totalPages - 1);

  return new ActionRowBuilder().addComponents(prev, info, next);
}

function paginate(array, pageSize, page) {
  const start = page * pageSize;
  return {
    items: array.slice(start, start + pageSize),
    totalPages: Math.ceil(array.length / pageSize),
    currentPage: page,
  };
}

module.exports = { buildPaginationRow, paginate };
