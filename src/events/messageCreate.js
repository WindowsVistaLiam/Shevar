const { EmbedBuilder } = require('discord.js');
const Profile = require('../models/Profile');
const { CHANNELS, GAINS, MIN_LENGTH, MAX_SOUILLURE } = require('../config/souillure');
const { LEVEL_TITLES } = require('../config/titles');
const { getActiveSlot } = require('../services/profileService');
const {
  getSouillureStageIndex,
  buildSouillureStageEmbed
} = require('../utils/souillureStages');
const { getTitleRarityDisplay, getTitleRarityColor } = require('../utils/titleUtils');

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

function getChannelType(message) {
  if (matchesConfiguredChannel(message, CHANNELS.SAINT)) return 'SAINT';
  if (matchesConfiguredChannel(message, CHANNELS.POLLUE)) return 'POLLUE';
  if (matchesConfiguredChannel(message, CHANNELS.SOUILLE)) return 'SOUILLE';
  return null;
}

function getAutomaticTitleRarity(level) {
  if (level >= 40) return 'legendary';
  if (level >= 15) return 'epic';
  if (level >= 5) return 'rare';
  return 'common';
}

function buildLevelUpEmbed({ profile, user, oldLevel, newLevel }) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('✨ Niveau RP augmenté')
    .setDescription(
      `**${profile.nomPrenom || user.username}** progresse.\n\n` +
      `**Niveau RP :** ${oldLevel} → ${newLevel}\n` +
      `**Messages RP validés :** ${profile.rpMessages}`
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

      const channelType = getChannelType(message);
      if (!channelType) return;

      const gain = GAINS[channelType] || 0;
      if (gain <= 0) return;

      const slot = await getActiveSlot(message.guild.id, message.author.id);
      const profile = await Profile.findOne({
        guildId: message.guild.id,
        userId: message.author.id,
        slot
      });

      if (!profile) return;

      const oldLevel = Number(profile.rpLevel) || 1;
      const oldCorruption = Number(profile.souillure) || 0;
      const oldStageIndex = getSouillureStageIndex(oldCorruption);

      profile.rpMessages = (Number(profile.rpMessages) || 0) + 1;
      profile.rpLevel = Math.floor(profile.rpMessages / 20) + 1;
      profile.souillure = Math.min(
        MAX_SOUILLURE || 100,
        Number((oldCorruption + gain).toFixed(2))
      );

      const newLevel = Number(profile.rpLevel) || 1;
      const newStageIndex = getSouillureStageIndex(profile.souillure);
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

      if (newLevel > oldLevel) {
        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [
            buildLevelUpEmbed({
              profile,
              user: message.author,
              oldLevel,
              newLevel
            })
          ]
        });
      }

      if (newStageIndex > oldStageIndex) {
        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [
            buildSouillureStageEmbed({
              profile,
              user: message.author,
              souillure: profile.souillure
            })
          ]
        });
      }

      for (const entry of newTitles) {
        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [
            buildTitleEmbed({
              profile,
              user: message.author,
              level: entry.level,
              title: entry.title,
              rarity: entry.rarity
            })
          ]
        });
      }
    } catch (error) {
      console.error('❌ Erreur messageCreate :', error);
    }
  }
};