const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const Profile = require('../models/Profile');
const { LOCATIONS } = require('../config/mapLocations');
const { getActiveSlot } = require('../services/profileService');

module.exports = function registerMapInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('map:')) return;

      const parts = interaction.customId.split(':');
      const action = parts[1];
      const ownerId = parts[2];

      // 🔒 sécurité utilisateur
      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: "Ce menu ne t'appartient pas.",
          flags: MessageFlags.Ephemeral
        });
      }

      // ⚡ important : defer pour éviter "interaction failed"
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot
      });

      if (!profile) {
        return interaction.editReply({
          content: "Profil introuvable."
        });
      }

      // 🌍 CHOISIR POSITION
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

        return interaction.editReply({
          content: "🌍 Choisis ta position :",
          components: rows
        });
      }

      // 👀 VOIR JOUEURS
      if (action === 'view') {
        if (!profile.location || profile.location === 'Aucune') {
          return interaction.editReply({
            content: "Tu n'as pas encore de position."
          });
        }

        const players = await Profile.find({
          guildId: interaction.guildId,
          location: profile.location
        });

        const list = players
          .map(p => `• ${p.nomPrenom || 'Sans nom'}`)
          .slice(0, 15);

        return interaction.editReply({
          content:
            list.length > 0
              ? `👥 Joueurs à **${profile.location}** :\n${list.join('\n')}`
              : "Aucun joueur ici."
        });
      }

      // 📍 SELECTION POSITION
      if (action === 'select') {
        const location = parts[3];

        profile.location = location;
        await profile.save();

        return interaction.editReply({
          content: `📍 Tu es maintenant à **${location}**.`
        });
      }

    } catch (err) {
      console.error('❌ Map interaction error:', err);

      // ⚠️ fallback pour éviter erreur Discord
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "Une erreur est survenue."
        });
      } else {
        await interaction.reply({
          content: "Une erreur est survenue.",
          flags: MessageFlags.Ephemeral
        });
      }
    }
  });
};