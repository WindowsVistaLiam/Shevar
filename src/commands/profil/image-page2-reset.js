const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

const BOOSTER_ROLE_ID = '1369034753025638483';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('image-page2-reset')
    .setDescription("Réinitialiser l'image de la page 2 du profil (boosters uniquement)")
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

    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, interaction.user.id);

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

    profile.imageUrlPage2 = '';
    await profile.save();

    await interaction.reply({
      content:
        `✅ L’image de la **page 2** a été réinitialisée pour **${profile.nomPrenom || interaction.user.username}** ` +
        `(**slot ${slot}**). La page 2 réutilisera maintenant l’image principale.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};