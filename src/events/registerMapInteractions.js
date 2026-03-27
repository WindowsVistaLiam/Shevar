const { MessageFlags } = require('discord.js');
const Profile = require('../models/Profile');
const { LOCATIONS } = require('../config/mapLocations');
const { getActiveSlot } = require('../services/profileService');

module.exports = function registerMapInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('map:')) return;

      const [, action, ownerId] = interaction.customId.split(':');

      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: "Ce menu ne t'appartient pas.",
          flags: MessageFlags.Ephemeral
        });
      }

      const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot
      });

      if (!profile) return;

      // 🌍 CHOIX POSITION
      if (action === 'set') {
        const buttons = LOCATIONS.map(loc =>
          new ButtonBuilder()
            .setCustomId(`map:select:${interaction.user.id}:${loc}`)
            .setLabel(loc)
            .setStyle(ButtonStyle.Secondary)
        );

        const rows = [];
        while (buttons.length) {
          rows.push(new ActionRowBuilder().addComponents(buttons.splice(0, 5)));
        }

        return interaction.reply({
          content: "Choisis ta position :",
          components: rows,
          flags: MessageFlags.Ephemeral
        });
      }

      // 👀 VOIR JOUEURS
      if (action === 'view') {
        const players = await Profile.find({
          guildId: interaction.guildId,
          location: profile.location
        });

        const list = players.map(p => `• ${p.nomPrenom}`).slice(0, 10);

        return interaction.reply({
          content: list.length > 0
            ? `👥 Joueurs à **${profile.location}** :\n${list.join('\n')}`
            : "Aucun joueur ici.",
          flags: MessageFlags.Ephemeral
        });
      }

      // 📍 SELECTION
      if (interaction.customId.startsWith('map:select')) {
        const [, , , location] = interaction.customId.split(':');

        profile.location = location;
        await profile.save();

        return interaction.reply({
          content: `📍 Tu es maintenant à **${location}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

    } catch (err) {
      console.error('❌ Map interaction error:', err);
    }
  });
};