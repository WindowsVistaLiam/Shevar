const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');

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

      const file = new AttachmentBuilder('src/assets/map.png', {
        name: 'map.png',
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
        .setImage('attachment://map.png')
        .setFooter({
          text: `${interaction.guild?.name || 'Serveur RP'} • Slot ${slot}`,
        })
        .setTimestamp();

      await interaction.update({
        embeds: [embed],
        files: [file],
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