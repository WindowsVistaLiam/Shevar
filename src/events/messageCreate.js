const Profile = require('../models/Profile');
const { CHANNELS, GAINS, MIN_LENGTH, MAX_SOUILLURE } = require('../config/souillure');
const { getActiveSlot } = require('../services/profileService');
const {
  getSouillureStageIndex,
  buildSouillureStageEmbed,
} = require('../utils/souillureStages');

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
        slot,
      });

      if (!profile) return;

      const oldCorruption = Number(profile.souillure) || 0;
      const oldStageIndex = getSouillureStageIndex(oldCorruption);

      profile.souillure = Math.min(
        MAX_SOUILLURE || 100,
        Number((oldCorruption + gain).toFixed(2))
      );

      await profile.save();

      const newStageIndex = getSouillureStageIndex(profile.souillure);

      if (newStageIndex > oldStageIndex) {
        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [
            buildSouillureStageEmbed({
              profile,
              user: message.author,
              souillure: profile.souillure,
            }),
          ],
        });
      }
    } catch (error) {
      console.error('❌ Erreur messageCreate :', error);
    }
  },
};