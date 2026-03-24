const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const Rumor = require('../../models/rumor');
const { getActiveSlot } = require('../../services/profileService');
const { getRumorPage, buildRumorListEmbed } = require('../../utils/rumorEmbeds');
const { buildRumorRows } = require('../../utils/rumorComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rumeur')
    .setDescription('Consulter et publier des rumeurs RP'),

  async execute(interaction) {
    const activeSlot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot: activeSlot
    }).lean();

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as pas de profil RP dans le **slot ${activeSlot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const mode = 'all';
    const page = 1;

    const rumors = await Rumor.find({
      guildId: interaction.guildId,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .lean();

    const pageData = getRumorPage(rumors, page);
    const embed = buildRumorListEmbed({
      rumors,
      page,
      mode,
      guild: interaction.guild,
      profileName: profile.nomPrenom,
      slot: activeSlot
    });

    const components = buildRumorRows(
      interaction.user.id,
      activeSlot,
      mode,
      pageData.page,
      pageData.totalPages,
      pageData.items
    );

    await interaction.reply({
      embeds: [embed],
      components,
      flags: MessageFlags.Ephemeral
    });
  }
};