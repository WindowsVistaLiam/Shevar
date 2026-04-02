const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');

const { LOCATIONS } = require('../../config/mapLocations');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Se déplacer sur la carte'),

  async execute(interaction) {
    try {
      // Charger l'image locale
      const file = new AttachmentBuilder('src/assets/map.png');

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('🗺️ Carte de Shevar')
        .setDescription(
          "Choisis ta destination à l’aide des boutons ci-dessous.\n" +
          "Chaque district correspond à une zone distincte de la ville."
        )
        .setImage('attachment://map.png') // IMPORTANT
        .setFooter({
          text: `${interaction.guild?.name || 'Serveur RP'} • Système de localisation`,
        })
        .setTimestamp();

      // Création des boutons automatiquement depuis LOCATIONS
      const rows = [];
      let currentRow = [];

      LOCATIONS.forEach((location, index) => {
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

        const button = new ButtonBuilder()
          .setCustomId(`map:${location}`)
          .setLabel(location)
          .setStyle(ButtonStyle.Secondary);

        currentRow.push(button);

        if (currentRow.length === 5 || index === LOCATIONS.length - 1) {
          rows.push(new ActionRowBuilder().addComponents(currentRow));
          currentRow = [];
        }
      });

      await interaction.reply({
        embeds: [embed],
        components: rows,
        files: [file], // IMPORTANT
      });
    } catch (error) {
      console.error('❌ Erreur commande /map :', error);

      await interaction.reply({
        content: 'Une erreur est survenue lors de l’affichage de la carte.',
        ephemeral: true,
      });
    }
  },
};