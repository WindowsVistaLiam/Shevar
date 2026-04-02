const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { isMj } = require('../../utils/profileLimits');
const { getTitleRarityColor, getTitleRarityDisplay } = require('../../utils/titleUtils');
const { MANUAL_TITLES, getManualTitleByName } = require('../../config/manualTitles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-titre')
    .setDescription('Attribuer un titre autorisé à un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Titre à attribuer (doit être dans la liste autorisée)')
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

    const alreadyHasTitle = (profile.titles || []).some(existing => {
      if (typeof existing === 'string') {
        return existing === titleData.name;
      }

      return existing.name === titleData.name;
    });

    if (alreadyHasTitle) {
      await interaction.reply({
        content: `**${profile.nomPrenom || targetUser.username}** possède déjà le titre **${titleData.name}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    profile.titles.push({
      name: titleData.name,
      rarity: titleData.rarity,
    });

    await profile.save();

    const embed = new EmbedBuilder()
      .setColor(getTitleRarityColor(titleData.rarity))
      .setTitle('🏅 Titre attribué')
      .setDescription(
        [
          `**Profil :** ${profile.nomPrenom || targetUser.username}`,
          `**Slot :** ${slot}`,
          `**Titre :** ${getTitleRarityDisplay(titleData.name, titleData.rarity)}`,
          '',
          `*${titleData.description}*`,
        ].join('\n')
      )
      .setThumbnail(profile.imageUrl || targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `${interaction.guild?.name || 'Serveur RP'} • Attribution staff`,
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};