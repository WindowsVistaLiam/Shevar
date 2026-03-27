const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Afficher la carte et ta position'),

  async execute(interaction) {
    const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot
    });

    if (!profile) {
      return interaction.reply({
        content: "Profil introuvable.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xe0b84d)
      .setTitle('🗺️ Carte du monde')
      .setDescription([
        `📍 **Position actuelle :** ${profile.location || 'Aucune'}`,
        '',
        'Utilise les boutons pour interagir.'
      ].join('\n'))
      .setFooter({ text: 'Système de carte RP' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`map:set:${interaction.user.id}`)
        .setLabel('🌍 Se positionner')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`map:view:${interaction.user.id}`)
        .setLabel('👀 Voir joueurs')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};