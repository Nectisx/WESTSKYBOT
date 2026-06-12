// src/index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlCorePlugin } = require('@distube/ytdl-core');
const logger = require('./utils/logger');
const { loadCommands, loadEvents } = require('./utils/commandLoader');
const GiveawayManager = require('./giveaways/GiveawayManager');
const InviteTracker = require('./invites/InviteTracker');
const { token } = require('./config/config');
const { COLORS, EMOJIS } = require('./config/constants');
const { EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction],
});

client.commands = new Collection();

// DisTube music engine
client.distube = new DisTube(client, {
  plugins: [new YtDlCorePlugin()],
  emitNewSongOnly: false,
  joinNewVoiceChannel: false,
  nsfw: false,
  leaveOnEmpty: true,
  leaveOnFinish: true,
  leaveOnStop: true,
  savePreviousSongs: false,
});

function buildNowPlayingEmbed(song, queue) {
  const loopLabel = { 0: '❌', 1: '🔂', 2: '🔁' };
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.MUSIC} Lecture en cours`)
    .setDescription(`**[${song.name}](${song.url})**\nPar **${song.uploader?.name || 'Inconnu'}**`)
    .addFields(
      { name: '⏱️ Durée', value: song.formattedDuration || '?', inline: true },
      { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
      { name: '🔁 Boucle', value: loopLabel[queue.repeatMode] ?? '❌', inline: true },
      { name: '🎵 File d\'attente', value: `${Math.max(0, queue.songs.length - 1)} piste(s)`, inline: true },
      { name: '👤 Ajouté par', value: song.member ? `<@${song.member.id}>` : 'Inconnu', inline: true },
    )
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: `⚔️ SOLARA • ${date}` })
    .setTimestamp();
}

// DisTube events
client.distube
  .on('playSong', (queue, song) => {
    if (!queue.textChannel) return;
    const embed = buildNowPlayingEmbed(song, queue);
    queue.textChannel.send({ embeds: [embed] }).catch(() => {});
  })
  .on('addSong', (queue, song) => {
    if (!queue.textChannel) return;
    const pos = queue.songs.indexOf(song);
    queue.textChannel.send({
      content: `📥 **${song.name}** ajouté à la file d'attente. (Position **${pos}**)`,
    }).catch(() => {});
  })
  .on('finish', (queue) => {
    if (queue.textChannel) {
      queue.textChannel.send({ content: '✅ File d\'attente terminée. À bientôt !' }).catch(() => {});
    }
  })
  .on('error', (channel, err) => {
    logger.error(`DisTube: ${err.message}`);
    if (channel) {
      channel.send({ content: `❌ Erreur musicale : ${err.message}` }).catch(() => {});
    }
  })
  .on('disconnect', (queue) => {
    logger.info(`DisTube: déconnecté [guild ${queue.id}]`);
  });

// Gestionnaires globaux
client.giveawayManager = new GiveawayManager(client);
client.inviteTracker = new InviteTracker(client);

// Chargement des commandes et events
loadCommands(client);
loadEvents(client);

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason) => {
  logger.error(`Rejet non géré: ${reason?.message || reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Exception non capturée: ${err.message}`);
  process.exit(1);
});

// Connexion
client.login(token).catch(err => {
  logger.error(`Impossible de se connecter: ${err.message}`);
  process.exit(1);
});
