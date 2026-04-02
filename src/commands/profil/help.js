const { SlashCommandBuilder } = require('discord.js');
const { buildHelpEmbed } = require('../../utils/helpEmbeds');
const { buildHelpNavigationRow } = require('../../utils/helpComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher l’aide du bot'),

  async execute(interaction) {
    try {
      const page = 1;

      const embed = buildHelpEmbed(
        page,
        interaction.guild?.name || 'Serveur RP'
      );

      const components = [buildHelpNavigationRow(page)];

      await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true, // visible uniquement par l'utilisateur
      });

    } catch (error) {
      console.error('❌ Erreur commande /help :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue lors de l’affichage de l’aide.',
          ephemeral: true,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue lors de l’affichage de l’aide.',
          ephemeral: true,
        }).catch(() => {});
      }
    }
  },
};