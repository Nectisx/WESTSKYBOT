const prisma = require('../database/prisma');

async function getRolePermissions(guildId, roleId) {
  const rp = await prisma.rolePermission.findUnique({
    where: { guildId_roleId: { guildId, roleId } },
  });
  if (!rp) return [];
  return JSON.parse(rp.commands);
}

async function setRolePermissions(guildId, roleId, commands) {
  await prisma.rolePermission.upsert({
    where: { guildId_roleId: { guildId, roleId } },
    update: { commands: JSON.stringify(commands) },
    create: { guildId, roleId, commands: JSON.stringify(commands) },
  });
}

async function clearRolePermissions(guildId, roleId) {
  await prisma.rolePermission.deleteMany({ where: { guildId, roleId } });
}

async function hasPermission(guildId, member, commandName) {
  if (!member?.roles?.cache) return false;
  const roleIds = [...member.roles.cache.keys()];
  if (roleIds.length === 0) return false;
  const records = await prisma.rolePermission.findMany({
    where: { guildId, roleId: { in: roleIds } },
  });
  for (const record of records) {
    if (JSON.parse(record.commands).includes(commandName)) return true;
  }
  return false;
}

async function getAllRolePermissions(guildId) {
  return prisma.rolePermission.findMany({ where: { guildId } });
}

module.exports = { getRolePermissions, setRolePermissions, clearRolePermissions, hasPermission, getAllRolePermissions };
