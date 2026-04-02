const CHANNELS = {
  SAINT: process.env.XP_CHANNELS_SAINT?.split(',').map(v => v.trim()).filter(Boolean) || [],
  POLLUE: process.env.XP_CHANNELS_POLLUE?.split(',').map(v => v.trim()).filter(Boolean) || [],
  SOUILLE: process.env.XP_CHANNELS_SOUILLE?.split(',').map(v => v.trim()).filter(Boolean) || [],
};

const GAINS = {
  SAINT: 5,
  POLLUE: 8,
  SOUILLE: 12,
};

const MIN_LENGTH = 20;
const MESSAGE_COOLDOWN_MS = 10_000;
const MAX_LEVEL = 50;

function xpRequiredForLevel(level) {
  return 100 + (level - 1) * 50;
}

function computeLevelFromXp(totalXp) {
  let xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;

  while (level < MAX_LEVEL) {
    const required = xpRequiredForLevel(level);
    if (xp < required) break;
    xp -= required;
    level += 1;
  }

  return level;
}

function getCurrentLevelProgress(totalXp) {
  let xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;

  while (level < MAX_LEVEL) {
    const required = xpRequiredForLevel(level);
    if (xp < required) {
      return {
        level,
        xpIntoLevel: xp,
        xpNeededForNextLevel: required,
        remainingXp: required - xp,
      };
    }

    xp -= required;
    level += 1;
  }

  return {
    level: MAX_LEVEL,
    xpIntoLevel: 0,
    xpNeededForNextLevel: 0,
    remainingXp: 0,
  };
}

module.exports = {
  CHANNELS,
  GAINS,
  MIN_LENGTH,
  MESSAGE_COOLDOWN_MS,
  MAX_LEVEL,
  xpRequiredForLevel,
  computeLevelFromXp,
  getCurrentLevelProgress,
};