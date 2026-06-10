// src/utils/timeParser.js

const units = {
  s: 1,
  sec: 1,
  m: 60,
  min: 60,
  h: 3600,
  heure: 3600,
  heures: 3600,
  d: 86400,
  j: 86400,
  jour: 86400,
  jours: 86400,
  w: 604800,
  semaine: 604800,
};

function parseTime(str) {
  if (!str) return null;
  const regex = /(\d+)\s*(s|sec|m|min|h|heure|heures|d|j|jour|jours|w|semaine)/gi;
  let totalSeconds = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (units[unit]) totalSeconds += value * units[unit];
  }
  return totalSeconds > 0 ? totalSeconds : null;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}j`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
}

function formatTimeRemaining(endsAt) {
  const remaining = Math.max(0, endsAt.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  if (totalSeconds <= 0) return 'Terminé';
  return formatDuration(totalSeconds);
}

module.exports = { parseTime, formatDuration, formatTimeRemaining };
