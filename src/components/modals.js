// src/components/modals.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function embedModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_create_embed')
    .setTitle('Créer un embed personnalisé');

  const titleInput = new TextInputBuilder()
    .setCustomId('embed_title')
    .setLabel('Titre')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const descInput = new TextInputBuilder()
    .setCustomId('embed_description')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4096);

  const colorInput = new TextInputBuilder()
    .setCustomId('embed_color')
    .setLabel('Couleur hex (ex: #FFD618)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(7)
    .setPlaceholder('#FFD618');

  const imageInput = new TextInputBuilder()
    .setCustomId('embed_image')
    .setLabel('URL Image (optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(imageInput),
  );
  return modal;
}

function rglModal(existingText = '') {
  const modal = new ModalBuilder()
    .setCustomId('modal_edit_reglement')
    .setTitle('Modifier le règlement');

  const textInput = new TextInputBuilder()
    .setCustomId('rgl_text')
    .setLabel('Texte du règlement')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000)
    .setValue(existingText);

  modal.addComponents(new ActionRowBuilder().addComponents(textInput));
  return modal;
}

module.exports = { embedModal, rglModal };
