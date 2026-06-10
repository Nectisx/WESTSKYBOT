// src/music/Queue.js
class Queue {
  constructor() {
    this.tracks = [];
  }

  get size() {
    return this.tracks.length;
  }

  add(track) {
    this.tracks.push(track);
  }

  remove(index) {
    if (index < 0 || index >= this.tracks.length) return null;
    return this.tracks.splice(index, 1)[0];
  }

  shift() {
    return this.tracks.shift() || null;
  }

  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  clear() {
    this.tracks = [];
  }

  get(index) {
    return this.tracks[index] || null;
  }

  getPage(page, perPage = 10) {
    const start = page * perPage;
    return this.tracks.slice(start, start + perPage);
  }

  totalPages(perPage = 10) {
    return Math.max(1, Math.ceil(this.tracks.length / perPage));
  }
}

module.exports = Queue;
