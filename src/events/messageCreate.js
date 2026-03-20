const Profile = require('../models/Profile');
const {
  CHANNELS,
  GAINS,
  MIN_LENGTH,
  MAX_SOUILLURE
} = require('../config/souillure');
const { getActiveSlot } = require('../services/profileService');
const {
  getSouillureStageIndex,
  buildSouillureStageEmbed
} = require('../utils/souillureStages');

const cooldowns = new Map();

function getChannelType(channelId) {
  if (CHANNELS.SAINT.includes(channelId)) return 'SAINT';
  if (CHANNELS.POLLUE.includes(channelId)) return 'POLLUE';
  if (CHANNELS.SOUILLE.includes(channelId)) return 'SOUILLE';
  return null;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      if (!message.guild) return;
      if (message.author.bot) return;
      if (message.content.length < MIN_LENGTH) return;

      const type = getChannelType(message.channel.id);
      if (!type) return;

      const key = `${message.guild.id}-${message.author.id}`;
      const now = Date.now();
      const last = cooldowns.get(key) || 0;

      if (now - last < 10000) return;
      cooldowns.set(key, now);

      const gain = GAINS[type];
      const slot = await getActiveSlot(message.guild.id, message.author.id);

      const profile = await Profile.findOne({
        guildId: message.guild.id,
        userId: message.author.id,
        slot
      });

      if (!profile) return;

      const oldSouillure = Number(profile.souillure) || 0;
      const oldStageIndex = getSouillureStageIndex(oldSouillure);

      let newSouillure = oldSouillure + gain;
      newSouillure = Math.min(newSouillure, MAX_SOUILLURE);
      newSouillure = Number(newSouillure.toFixed(2));

      profile.souillure = newSouillure;
      await profile.save();

      const newStageIndex = getSouillureStageIndex(newSouillure);

      if (newStageIndex > oldStageIndex) {
        const embed = buildSouillureStageEmbed({
          profileName: profile.nomPrenom || message.author.username,
          souillure: newSouillure
        });

        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embed]
        });
      }
    } catch (error) {
      console.error('❌ Erreur souillure message:', error);
    }
  }
};