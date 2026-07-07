// src/embeds/errorEmbed.js
const { createEmbed } = require('./baseEmbed');
const { COLORS } = require('../config/constants');

function errorEmbed(title, description) {
  return createEmbed(COLORS.DANGER)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

function permissionError(missing) {
  return errorEmbed('Permission manquante', `Tu n'as pas la permission requise : **${missing}**`);
}

function hierarchyError() {
  return errorEmbed('Hiérarchie invalide', 'Tu ne peux pas modérer un membre avec un rôle supérieur ou égal au tien.');
}

function botTargetError() {
  return errorEmbed('Action impossible', 'Tu ne peux pas utiliser cette commande sur un bot.');
}

function cooldownError(seconds) {
  return errorEmbed('Cooldown actif', `Attends encore **${seconds}s** avant de réutiliser cette commande.`);
}

module.exports = { errorEmbed, permissionError, hierarchyError, botTargetError, cooldownError };
