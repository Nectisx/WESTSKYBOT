// src/commands/admin/staff.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');
const prisma = require('../../database/prisma');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Affiche la liste des membres du staff WestSky'),

  async execute(interaction) {
    await interaction.deferReply();
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });

    const adminIds = new Set();
    const modIds = new Set();

    if (config?.adminRoleId) {
      const role = interaction.guild.roles.cache.get(config.adminRoleId);
      if (role) role.members.forEach(m => adminIds.add(m.id));
    }
    if (config?.modRoleId) {
      const role = interaction.guild.roles.cache.get(config.modRoleId);
      if (role) role.members.forEach(m => { if (!adminIds.has(m.id)) modIds.add(m.id); });
    }

    if (adminIds.size === 0 && modIds.size === 0) {
      return interaction.editReply({
        content: '⚠️ Aucun rôle staff configuré. Utilise `/config param set` pour définir `mod_role` et `admin_role`.',
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('👥 Équipe WestSky')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: '⚔️ WestSky' })
      .setTimestamp();

    if (adminIds.size > 0) {
      embed.addFields({
        name: `👑 Administrateurs (${adminIds.size})`,
        value: [...adminIds].map(id => `<@${id}>`).join('\n'),
        inline: true,
      });
    }
    if (modIds.size > 0) {
      embed.addFields({
        name: `🛡️ Modérateurs (${modIds.size})`,
        value: [...modIds].map(id => `<@${id}>`).join('\n'),
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
