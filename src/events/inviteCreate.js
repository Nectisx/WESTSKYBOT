// src/events/inviteCreate.js
module.exports = {
  name: 'inviteCreate',
  once: false,
  async execute(invite, client) {
    if (client.inviteTracker) {
      client.inviteTracker.onInviteCreate(invite);
    }
  },
};
