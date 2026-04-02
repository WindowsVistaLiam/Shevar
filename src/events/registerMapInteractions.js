const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const path = require('path');
const fs = require('fs');

const Profile = require('../models/Profile');
const { LOCATIONS } = require('../config/mapLocations');
const { getActiveSlot } = require('../services/profileService');

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

function getLocationImageFilename(location) {
  switch (location) {
    case "Shevar' District 0":
      return 'district0.png';
    case "Shevar' District 1":
      return 'district1.png';
    case "Shevar' District 2":
      return 'district2.png';
    case "Shevar' District 3":
      return 'district3.png';
    case "Shevar' District 4":
      return 'district4.png';
    case "Shevar' District 5":
      return 'district5.png';
    case "Shevar' District 6":
      return 'district6.png';
    case "Shevar' District 7":
      return 'district7.png';
    case "Shevar' District 8":
      return 'district8.png';
    case "Extérieur de Shevar'":
      return 'extérieur.png';
    case 'Endroit Inconnu':
      return 'autre.jpeg';
    default:
      return 'autre.jpeg';
  }
}

function getLocationImagePath(location) {
  const filename = getLocationImageFilename(location);
  const fullPath = path.join(process.cwd(), 'src', 'assets', filename);

  if (fs.existsSync(fullPath)) {
    return { path: fullPath, name: filename };
  }

  const fallbackUnknown = path.join(process.cwd(), 'src', 'assets', 'autre.jpeg');
  if (fs.existsSync(fallbackUnknown)) {
    return { path: fallbackUnknown, name: 'autre.jpeg' };
  }

  const fallbackMap = path.join(process.cwd(), 'src', 'assets', 'map.png');
  return { path: fallbackMap, name: 'map.png' };
}

module.exports = function registerMapInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isStringSelectMenu()) return;
      if (!interaction.customId.startsWith('map_select:')) return;

      const [, ownerUserId] = interaction.customId.split(':');

      if (interaction.user.id !== ownerUserId) {
        await interaction.reply({
          content: 'Ce menu ne t’appartient pas.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const selectedLocation = interaction.values[0];
      const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot,
      });

      if (!profile) {
        await interaction.reply({
          content: `Tu n’as pas de profil dans le **slot ${slot}**.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      profile.location = selectedLocation;
      await profile.save();

      const mapFile = new AttachmentBuilder(
        path.join(process.cwd(), 'src', 'assets', 'map.png'),
        { name: 'map.png' }
      );

      const locationImage = getLocationImagePath(selectedLocation);
      const locationFile = new AttachmentBuilder(locationImage.path, {
        name: locationImage.name,
      });

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('🗺️ Carte de Shevar')
        .setDescription(
          [
            `**Position actuelle :** ${selectedLocation}`,
            '',
            'Ta localisation a bien été mise à jour.',
          ].join('\n')
        )
        .addFields(
          {
            name: '📍 Aperçu de la zone',
            value: selectedLocation,
            inline: false,
          }
        )
        .setImage(`attachment://${locationImage.name}`)
        .setThumbnail('attachment://map.png')
        .setFooter({
          text: `${interaction.guild?.name || 'Serveur RP'} • Slot ${slot}`,
        })
        .setTimestamp();

      await interaction.update({
        embeds: [embed],
        files: [mapFile, locationFile],
        components: [buildMapSelectMenu(interaction.user.id, selectedLocation)],
      });
    } catch (error) {
      console.error('❌ Erreur interactions map :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la mise à jour de la position.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la mise à jour de la position.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }
  });
};