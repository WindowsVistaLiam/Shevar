const { EmbedBuilder } = require('discord.js');
const Profile = require('../models/Profile');
const { CHANNELS, GAINS, MIN_LENGTH, MESSAGE_COOLDOWN_MS, computeLevelFromXp } = require('../config/xp');
const { SOUILLURE_CHANNELS, SOUILLURE_GAINS, MAX_SOUILLURE } = require('../config/souillure');
const { LEVEL_TITLES } = require('../config/titles');
const { getActiveSlot } = require('../services/profileService');
const { getTitleRarityDisplay, getTitleRarityColor } = require('../utils/titleUtils');

const cooldowns = new Map();

function normalizeIdArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

function matchesConfiguredChannel(message, configuredIds) {
  const ids = normalizeIdArray(configuredIds);
  if (ids.length === 0) return false;

  const channelId = String(message.channel.id);
  const parentId = message.channel.parentId ? String(message.channel.parentId) : null;

  if (ids.includes(channelId)) return true;
  if (parentId && ids.includes(parentId)) return true;

  return false;
}

function getXpChannelType(message) {
  if (matchesConfiguredChannel(message, CHANNELS.SAINT)) return 'SAINT';
  if (matchesConfiguredChannel(message, CHANNELS.POLLUE)) return 'POLLUE';
  if (matchesConfiguredChannel(message, CHANNELS.SOUILLE)) return 'SOUILLE';
  return null;
}

function getCorruptionGain(message) {
  if (matchesConfiguredChannel(message, SOUILLURE_CHANNELS.SAINT)) {
    return SOUILLURE_GAINS.SAINT || 0;
  }

  if (matchesConfiguredChannel(message, SOUILLURE_CHANNELS.POLLUE)) {
    return SOUILLURE_GAINS.POLLUE || 0;
  }

  if (matchesConfiguredChannel(message, SOUILLURE_CHANNELS.SOUILLE)) {
    return SOUILLURE_GAINS.SOUILLE || 0;
  }

  return 0;
}

function getAutomaticTitleRarity(level) {
  if (level >= 40) return 'legendary';
  if (level >= 15) return 'epic';
  if (level >= 5) return 'rare';
  return 'common';
}

function buildLevelUpEmbed({ profile, user, oldLevel, newLevel, gainedXp, totalXp }) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('✨ Niveau RP augmenté')
    .setDescription(
      `**${profile.nomPrenom || user.username}** gagne de l'expérience RP.\n\n` +
      `**XP gagnée :** +${gainedXp}\n` +
      `**XP totale :** ${totalXp}\n` +
      `**Niveau RP :** ${oldLevel} → ${newLevel}`
    )
    .setThumbnail(profile.imageUrl || user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Slot ${profile.slot} • ${user.username}` })
    .setTimestamp();
}

function buildTitleEmbed({ profile, user, level, title, rarity }) {
  return new EmbedBuilder()
    .setColor(getTitleRarityColor(rarity))
    .setTitle('🏅 Nouveau titre obtenu')
    .setDescription(
      `**${profile.nomPrenom || user.username}** progresse dans son parcours RP.\n\n` +
      `**Niveau RP :** ${level}\n` +
      `**Titre obtenu :** ${getTitleRarityDisplay(title, rarity)}`
    )
    .setThumbnail(profile.imageUrl || user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Slot ${profile.slot} • ${user.username}` })
    .setTimestamp();
}

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    try {
      if (!message.guild) return;
      if (!message.author || message.author.bot) return;
      if (!message.content || message.content.length < MIN_LENGTH) return;

      const key = `${message.guild.id}-${message.author.id}`;
      const now = Date.now();
      const last = cooldowns.get(key) || 0;

      if (now - last < MESSAGE_COOLDOWN_MS) return;
      cooldowns.set(key, now);

      const xpChannelType = getXpChannelType(message);
      const xpGain = xpChannelType ? (GAINS[xpChannelType] || 0) : 0;
      const corruptionGain = getCorruptionGain(message);

      if (xpGain <= 0 && corruptionGain <= 0) return;

      const slot = await getActiveSlot(message.guild.id, message.author.id);
      const profile = await Profile.findOne({
        guildId: message.guild.id,
        userId: message.author.id,
        slot,
      });

      if (!profile) return;

      const oldLevel = Number(profile.rpLevel) || 1;
      const oldXp = Number(profile.xp) || 0;
      const oldCorruption = Number(profile.souillure) || 0;

      profile.rpMessages = (Number(profile.rpMessages) || 0) + 1;

      if (xpGain > 0) {
        profile.xp = oldXp + xpGain;
        profile.rpLevel = computeLevelFromXp(profile.xp);
      }

      if (corruptionGain > 0) {
        profile.souillure = Math.min(MAX_SOUILLURE || 100, oldCorruption + corruptionGain);
      }

      const newLevel = Number(profile.rpLevel) || 1;
      const newTitles = [];

      for (let level = oldLevel + 1; level <= newLevel; level += 1) {
        const title = LEVEL_TITLES[level];

        if (
          title &&
          !profile.titles.some(existing => {
            if (typeof existing === 'string') return existing === title;
            return existing.name === title;
          })
        ) {
          const rarity = getAutomaticTitleRarity(level);
          profile.titles.push({ name: title, rarity });
          newTitles.push({ level, title, rarity });
        }
      }

      await profile.save();

      if (newLevel > oldLevel && xpGain > 0) {
        const levelEmbed = buildLevelUpEmbed({
          profile,
          user: message.author,
          oldLevel,
          newLevel,
          gainedXp: xpGain,
          totalXp: profile.xp,
        });

        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [levelEmbed],
        });
      }

      for (const entry of newTitles) {
        const titleEmbed = buildTitleEmbed({
          profile,
          user: message.author,
          level: entry.level,
          title: entry.title,
          rarity: entry.rarity,
        });

        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [titleEmbed],
        });
      }
    } catch (error) {
      console.error('❌ Erreur messageCreate :', error);
    }
  },
};