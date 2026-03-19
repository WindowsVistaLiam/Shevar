const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');
const {
  getAllProfiles,
  getActiveSlot,
  setActiveSlot
} = require('../../services/profileService');
const { getMaxProfileSlotsForMember } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-supprimer')
    .setDescription('Supprimer l’un de tes profils RP')
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot du profil à supprimer')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const slot = interaction.options.getInteger('slot', true);
    const maxSlots = getMaxProfileSlotsForMember(interaction.member);

    if (slot > maxSlots) {
      await interaction.reply({
        content: `Tu n’as pas accès au **slot ${slot}**.`,
        ephemeral: true
      });
      return;
    }

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as aucun profil dans le **slot ${slot}**.`,
        ephemeral: true
      });
      return;
    }

    const activeSlot = await getActiveSlot(interaction.guildId, interaction.user.id);

    await Profile.deleteOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot
    });

    const remainingProfiles = await getAllProfiles(interaction.guildId, interaction.user.id);

    if (remainingProfiles.length === 0) {
      await setActiveSlot(interaction.guildId, interaction.user.id, 1);
    } else if (activeSlot === slot) {
      await setActiveSlot(interaction.guildId, interaction.user.id, remainingProfiles[0].slot);
    }

    await interaction.reply({
      content:
        `✅ Ton profil du **slot ${slot}** a bien été supprimé.\n` +
        `Nom du profil supprimé : **${profile.nomPrenom || 'Sans nom'}**`,
      ephemeral: true
    });
  }
};