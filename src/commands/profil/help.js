const { SlashCommandBuilder } = require('discord.js');
const { buildHelpEmbed } = require('../../utils/helpEmbeds');
const { buildHelpNavigationRow } = require('../../utils/helpComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher l’aide du bot'),

  async execute(interaction) {
    const page = 1;

    await interaction.reply({
      embeds: [buildHelpEmbed(page, interaction.guild?.name || 'Serveur RP')],
      components: [buildHelpNavigationRow(page)],
      ephemeral: true
    });
  }
};