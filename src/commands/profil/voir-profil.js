const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');
const { buildProfileEmbed } = require('../../utils/profileEmbeds');
const {
  buildProfileNavigationRow,
  buildProfileSlotRow
} = require('../../utils/profileComponents');
const { getActiveSlot, getAllProfiles } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voir-profil')
    .setDescription('Voir le profil RP d’un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur dont tu veux voir le profil')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot du profil à afficher')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const requestedSlot = interaction.options.getInteger('slot');
    const targetSlot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot: targetSlot
    }).lean();

    if (!profile) {
      await interaction.reply({
        content:
          targetUser.id === interaction.user.id
            ? `Tu n’as pas encore de profil RP dans le **slot ${targetSlot}**.`
            : `${targetUser.username} n’a pas de profil RP dans le **slot ${targetSlot}**.`,
        ephemeral: true
      });
      return;
    }

    const allProfiles = await getAllProfiles(interaction.guildId, targetUser.id);
    const existingSlots = allProfiles.map(entry => entry.slot);

    const embed = buildProfileEmbed(profile, targetUser, interaction.guild, 1);

    await interaction.reply({
      embeds: [embed],
      components: [
        buildProfileSlotRow(targetUser.id, targetSlot, existingSlots),
        buildProfileNavigationRow(targetUser.id, targetSlot, 1)
      ]
    });
  }
};