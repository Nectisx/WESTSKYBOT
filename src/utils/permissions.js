// src/utils/permissions.js
const { PermissionFlagsBits } = require('discord.js');

function hasPermission(member, permission) {
  return member.permissions.has(permission);
}

function canModerate(moderator, target) {
  if (target.user.bot) return { ok: false, reason: 'bot' };
  if (target.id === moderator.guild.ownerId) return { ok: false, reason: 'owner' };
  if (moderator.roles.highest.position <= target.roles.highest.position) {
    return { ok: false, reason: 'hierarchy' };
  }
  return { ok: true };
}

function isModerator(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers)
  );
}

function isAdmin(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.guild.ownerId === member.id
  );
}

module.exports = { hasPermission, canModerate, isModerator, isAdmin };
