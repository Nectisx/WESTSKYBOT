// src/reactionRoles/ReactionRoleManager.js
const logger = require('../utils/logger');

class ReactionRoleManager {
  constructor(client) {
    this.client = client;
    this.rules = new Map();
  }

  addRule(messageId, emoji, roleId) {
    if (!this.rules.has(messageId)) this.rules.set(messageId, new Map());
    this.rules.get(messageId).set(emoji, roleId);
  }

  removeRule(messageId, emoji) {
    if (this.rules.has(messageId)) this.rules.get(messageId).delete(emoji);
  }

  async handleReactionAdd(reaction, user) {
    if (user.bot) return;
    const rules = this.rules.get(reaction.message.id);
    if (!rules) return;
    const roleId = rules.get(reaction.emoji.name) || rules.get(reaction.emoji.toString());
    if (!roleId) return;
    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(roleId);
    } catch (err) {
      logger.warn(`ReactionRole add error: ${err.message}`);
    }
  }

  async handleReactionRemove(reaction, user) {
    if (user.bot) return;
    const rules = this.rules.get(reaction.message.id);
    if (!rules) return;
    const roleId = rules.get(reaction.emoji.name) || rules.get(reaction.emoji.toString());
    if (!roleId) return;
    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.remove(roleId);
    } catch (err) {
      logger.warn(`ReactionRole remove error: ${err.message}`);
    }
  }
}

module.exports = ReactionRoleManager;
