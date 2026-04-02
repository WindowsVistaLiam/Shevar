const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

const BOOSTER_ROLE_ID = '1369034753025638483';

function isValidImageUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('image-page2')
    .setDescription("Modifier l'image affichée sur la page 2 du profil (boosters uniquement)")
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription("URL de l'image")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Slot ciblé (sinon slot actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const hasBoosterRole = member.roles?.cache?.has(BOOSTER_ROLE_ID);

    if (!hasBoosterRole) {
      await interaction.reply({
        content: "Tu dois avoir le rôle booster pour modifier l'image de la page 2.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const url = interaction.options.getString('url', true).trim();
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, interaction.user.id);

    if (!isValidImageUrl(url)) {
      await interaction.reply({
        content: "L'URL fournie n'est pas valide.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot,
    });

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as pas de profil dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    profile.imageUrlPage2 = url;
    await profile.save();

    await interaction.reply({
      content:
        `✅ L’image de la **page 2** a été mise à jour pour **${profile.nomPrenom || interaction.user.username}** ` +
        `(**slot ${slot}**).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};