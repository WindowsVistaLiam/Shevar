const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const {
  getProfileBySlot,
  setActiveSlot,
  ensureActiveState
} = require('../../services/profileService');
const { getMaxProfileSlotsForMember } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-creer')
    .setDescription('Créer un nouveau profil RP dans un slot précis')
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot dans lequel créer le profil')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    await ensureActiveState(interaction.guildId, interaction.user.id);

    const slot = interaction.options.getInteger('slot', true);
    const maxSlots = getMaxProfileSlotsForMember(interaction.member);

    if (slot > maxSlots) {
      await interaction.reply({
        content: `Tu ne peux pas créer de profil au-delà du **slot ${maxSlots}**.`,
        ephemeral: true
      });
      return;
    }

    const existingProfile = await getProfileBySlot(
      interaction.guildId,
      interaction.user.id,
      slot
    );

    if (existingProfile) {
      await interaction.reply({
        content:
          `Un profil existe déjà dans le **slot ${slot}**.\n` +
          `Utilise \`/profil-switch slot:${slot}\` puis \`/profil\` pour le modifier.`,
        ephemeral: true
      });
      return;
    }

    await setActiveSlot(interaction.guildId, interaction.user.id, slot);

    const modal = new ModalBuilder()
      .setCustomId(`profile_create:${interaction.user.id}:${slot}`)
      .setTitle(`Création du profil RP • Slot ${slot}`);

    const fullNameInput = new TextInputBuilder()
      .setCustomId('full_name')
      .setLabel('Nom et Prénom')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200);

    const ageGenderInput = new TextInputBuilder()
      .setCustomId('age_gender')
      .setLabel('Âge et Genre')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200);

    const pouvoirInput = new TextInputBuilder()
      .setCustomId('pouvoir')
      .setLabel('Pouvoir / Aptitude')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description du Personnage')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const imageInput = new TextInputBuilder()
      .setCustomId('image')
      .setLabel('Image')
      .setPlaceholder('https://...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(fullNameInput),
      new ActionRowBuilder().addComponents(ageGenderInput),
      new ActionRowBuilder().addComponents(pouvoirInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);
  }
};