const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

const Profile = require('../../models/Profile');
const { LOCATIONS } = require('../../config/mapLocations');
const { getActiveSlot } = require('../../services/profileService');

function buildMapSelectMenu(ownerUserId, selectedLocation = '') {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`map_select:${ownerUserId}`)
      .setPlaceholder('Choisis ta destination')
      .addOptions(
        LOCATIONS.map(location => ({
          label: location,
          value: location,
          description:
            location === selectedLocation
              ? 'Position actuelle'
              : `Se déplacer vers ${location}`,
          default: location === selectedLocation,
        }))
      )
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Afficher la carte et choisir une destination'),

  async execute(interaction) {
    try {
      const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot,
      });

      if (!profile) {
        await interaction.reply({
          content: `Tu n’as pas de profil dans le **slot ${slot}**.`,
          ephemeral: true,
        });
        return;
      }

      const file = new AttachmentBuilder('src/assets/map.png', {
        name: 'map.png',
      });

      const currentLocation = profile.location || 'Endroit Inconnu';

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('🗺️ Carte de Shevar')
        .setDescription(
          [
            `**Position actuelle :** ${currentLocation}`,
            '',
            'Utilise le menu déroulant ci-dessous pour choisir où se trouve ton personnage.',
          ].join('\n')
        )
        .setImage('attachment://map.png')
        .setFooter({
          text: `${interaction.guild?.name || 'Serveur RP'} • Slot ${slot}`,
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        files: [file],
        components: [buildMapSelectMenu(interaction.user.id, currentLocation)],
        ephemeral: true,
      });
    } catch (error) {
      console.error('❌ Erreur commande /map :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue lors de l’ouverture de la carte.',
          ephemeral: true,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue lors de l’ouverture de la carte.',
          ephemeral: true,
        }).catch(() => {});
      }
    }
  },
};