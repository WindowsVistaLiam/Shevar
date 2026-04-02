const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { getRelationPage, buildRelationListEmbed } = require('../../utils/relationEmbeds');
const { buildRelationRows } = require('../../utils/relationComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('relation')
    .setDescription('Gérer les relations RP de ton profil actif'),

  async execute(interaction) {
    const activeSlot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot: activeSlot,
    }).lean();

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as pas de profil RP dans le **slot ${activeSlot}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const page = 1;
    const pageData = getRelationPage(profile.relations || [], page);
    const embed = buildRelationListEmbed(profile, interaction.user, interaction.guild, page);

    const components = buildRelationRows(
      interaction.user.id,
      activeSlot,
      pageData.page,
      pageData.totalPages,
      pageData.items
    );

    await interaction.reply({
      embeds: [embed],
      components,
    });
  },
};