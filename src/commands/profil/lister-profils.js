const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllProfiles, getActiveSlot } = require('../../services/profileService');
const { isMj, isAdmin } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lister-profils')
    .setDescription('Lister les profils d’un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(false)
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