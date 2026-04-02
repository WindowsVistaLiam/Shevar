const { buildProfileEmbed } = require('./profileEmbeds');

async function buildProfilePagePayload(profile, targetUser, guild, page) {
  const embed = buildProfileEmbed(profile, targetUser, guild, page);

  return {
    embeds: [embed],
    files: [],
  };
}

module.exports = { buildProfilePagePayload };