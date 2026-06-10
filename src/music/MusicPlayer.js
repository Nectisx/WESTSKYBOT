// src/music/MusicPlayer.js
// ⚠️ IMPORTANT : play-dl avec @discordjs/voice est recommandé en 2024.
// Si YouTube bloque les streams, envisager DisTube (npm i distube) qui abstrait la complexité.
// Sur les PaaS sans FFmpeg natif, ffmpeg-static est inclus automatiquement.
// Lavalink est la solution la plus stable en production mais nécessite un serveur Java séparé.

const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const play = require('play-dl');
const Queue = require('./Queue');
const Track = require('./Track');
const logger = require('../utils/logger');
const { buildNowPlayingEmbed, buildQueueEmbed } = require('../embeds/musicEmbed');

class MusicPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = new Queue();
    this.player = createAudioPlayer();
    this.connection = null;
    this.loopMode = 'none';
    this.volume = 100;
    this.playing = false;
    this.paused = false;
    this.currentTrack = null;
    this.textChannel = null;
    this.inactivityTimer = null;

    this.player.on(AudioPlayerStatus.Idle, () => this._onIdle());
    this.player.on('error', err => {
      logger.error(`AudioPlayer error [${this.guildId}]: ${err.message}`);
      this._onIdle();
    });
  }

  async join(voiceChannel) {
    if (this.connection) {
      try {
        await entersState(this.connection, VoiceConnectionStatus.Ready, 5000);
        return;
      } catch {
        this.connection.destroy();
      }
    }
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    this.connection.subscribe(this.player);
    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
    } catch (err) {
      this.connection.destroy();
      this.connection = null;
      throw new Error('Impossible de rejoindre le salon vocal');
    }
  }

  async play(query, requestedBy) {
    let trackInfo;
    try {
      if (play.yt_validate(query) === 'video') {
        const info = await play.video_info(query);
        trackInfo = {
          title: info.video_details.title,
          url: info.video_details.url,
          author: info.video_details.channel?.name || 'Inconnu',
          duration: info.video_details.durationRaw,
          thumbnail: info.video_details.thumbnails?.[0]?.url || null,
          requestedBy,
        };
      } else {
        const results = await play.search(query, { limit: 1 });
        if (!results || results.length === 0) throw new Error('Aucun résultat trouvé');
        const video = results[0];
        trackInfo = {
          title: video.title,
          url: video.url,
          author: video.channel?.name || 'Inconnu',
          duration: video.durationRaw,
          thumbnail: video.thumbnails?.[0]?.url || null,
          requestedBy,
        };
      }
    } catch (err) {
      throw new Error(`Erreur de recherche : ${err.message}`);
    }

    const track = new Track(trackInfo);
    this.queue.add(track);

    if (!this.playing && !this.paused) {
      await this._playNext();
    }
    return track;
  }

  async _playNext() {
    if (this.loopMode === 'track' && this.currentTrack) {
      // Ne pas dépiler, relire la même piste
    } else if (this.loopMode === 'queue' && this.currentTrack) {
      this.queue.add(this.currentTrack);
      this.currentTrack = this.queue.shift();
    } else {
      this.currentTrack = this.queue.shift();
    }

    if (!this.currentTrack) {
      this.playing = false;
      this._startInactivityTimer();
      return;
    }

    try {
      const stream = await play.stream(this.currentTrack.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });
      resource.volume?.setVolume(this.volume / 100);
      this.player.play(resource);
      this.playing = true;
      this.paused = false;
      this._clearInactivityTimer();

      if (this.textChannel) {
        const embed = buildNowPlayingEmbed(this.currentTrack, this);
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      logger.error(`Erreur playback [${this.guildId}]: ${err.message}`);
      this.playing = false;
      if (this.queue.size > 0) await this._playNext();
    }
  }

  _onIdle() {
    this.playing = false;
    if (this.queue.size > 0 || this.loopMode === 'track') {
      this._playNext();
    } else {
      this.currentTrack = null;
      this._startInactivityTimer();
    }
  }

  async skip() {
    const skipped = this.currentTrack;
    this.loopMode = this.loopMode === 'track' ? 'none' : this.loopMode;
    this.player.stop();
    return skipped;
  }

  pause() {
    if (this.playing && !this.paused) {
      this.player.pause();
      this.paused = true;
      this.playing = false;
      return true;
    }
    return false;
  }

  resume() {
    if (this.paused) {
      this.player.unpause();
      this.paused = false;
      this.playing = true;
      return true;
    }
    return false;
  }

  stop() {
    this.queue.clear();
    this.currentTrack = null;
    this.loopMode = 'none';
    this.player.stop();
    this.playing = false;
    this.paused = false;
    this._startInactivityTimer();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(200, vol));
    const state = this.player.state;
    if (state.status !== AudioPlayerStatus.Idle && state.resource?.volume) {
      state.resource.volume.setVolume(this.volume / 100);
    }
  }

  setLoop(mode) {
    if (!['none', 'track', 'queue'].includes(mode)) return false;
    this.loopMode = mode;
    return true;
  }

  shuffle() {
    this.queue.shuffle();
  }

  remove(index) {
    return this.queue.remove(index);
  }

  _startInactivityTimer() {
    this._clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.destroy();
    }, 30000);
  }

  _clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  destroy() {
    this._clearInactivityTimer();
    this.queue.clear();
    this.currentTrack = null;
    this.playing = false;
    this.paused = false;
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }

  buildNowPlayingEmbed() {
    if (!this.currentTrack) return null;
    return buildNowPlayingEmbed(this.currentTrack, this);
  }

  buildQueueEmbed(page = 0) {
    const tracks = this.queue.getPage(page);
    const totalPages = this.queue.totalPages();
    return buildQueueEmbed(tracks, this.currentTrack, page, totalPages);
  }
}

module.exports = MusicPlayer;
