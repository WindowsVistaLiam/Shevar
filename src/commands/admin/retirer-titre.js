const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');

const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { isMj } = require('../../utils/profileLimits');
const { MANUAL_TITLES, getManualTitleByName } = require('../../config/manualTitles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirer-titre')
    .setDescription('Retirer un titre autorisé à un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Titre à retirer (doit être dans la liste autorisée)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon profil actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const mj = isMj(member);

    if (!isAdmin && !mj) {
      await interaction.reply({
        content: "Tu n’as pas la permission d’utiliser cette commande.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const targetUser = interaction.options.getUser('utilisateur', true);
    const titleInput = interaction.options.getString('titre', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const titleData = getManualTitleByName(titleInput);

    if (!titleData) {
      await interaction.reply({
        content:
          'Ce titre n’est pas autorisé.\n\n' +
          `Titres valides : ${MANUAL_TITLES.map(t => `**${t.name}**`).join(', ')}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot,
    });

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const previousLength = (profile.titles || []).length;

    profile.titles = (profile.titles || []).filter(existing => {
      if (typeof existing === 'string') {
        return existing !== titleData.name;
      }

      return existing.name !== titleData.name;
    });

    if ((profile.titles || []).length === previousLength) {
      await interaction.reply({
        content: `**${profile.nomPrenom || targetUser.username}** ne possède pas le titre **${titleData.name}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (profile.equippedTitle === titleData.name) {
      profile.equippedTitle = '';
    }

    await profile.save();

    await interaction.reply({
      content:
        `✅ Le titre **${titleData.name}** a été retiré à **${profile.nomPrenom || targetUser.username}** ` +
        `(**slot ${slot}**).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};