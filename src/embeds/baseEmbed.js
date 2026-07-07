// src/embeds/baseEmbed.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, BOT_NAME } = require('../config/constants');

// Footer standard du bot — source unique pour tout le projet
function brandFooter() {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return { text: `${BOT_NAME} • ${date}` };
}

function createEmbed(color = COLORS.PRIMARY) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter(brandFooter())
    .setTimestamp();
}

function successEmbed(title, description) {
  return createEmbed(COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

function warningEmbed(title, description) {
  return createEmbed(COLORS.DEEP)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

module.exports = { createEmbed, successEmbed, warningEmbed, brandFooter };
