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

      await interaction.reply({
        embeds: [buildHelpEmbed(page, interaction.guild?.name || 'Serveur RP')],
        components: [buildHelpNavigationRow(page)],
        ephemeral: true,
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