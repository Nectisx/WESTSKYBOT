// src/music/Track.js
class Track {
  constructor({ title, url, author, duration, thumbnail, requestedBy }) {
    this.title = title;
    this.url = url;
    this.author = author;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.requestedBy = requestedBy;
  }

  toString() {
    return `[${this.title}](${this.url}) par ${this.author} — ${this.duration}`;
  }
}

module.exports = Track;
