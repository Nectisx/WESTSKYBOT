// src/events/inviteDelete.js
module.exports = {
  name: 'inviteDelete',
  once: false,
  async execute(invite, client) {
    if (client.inviteTracker) {
      client.inviteTracker.onInviteDelete(invite);
    }
  },
};
