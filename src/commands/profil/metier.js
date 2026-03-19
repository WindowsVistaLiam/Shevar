const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('metier')
    .setDescription('Modifier ton métier affiché sur ton profil')
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Le nom de ton métier')
        .setRequired(true)
        .setMaxLength(100)
    ),

  async execute(interaction) {
    const nomMetier = interaction.options.getString('nom', true).trim();

    const profile = await Profile.findOneAndUpdate(
      {
        guildId: interaction.guildId,
        userId: interaction.user.id
      },
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        metier: nomMetier
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content: `✅ Ton métier a été mis à jour : **${profile.metier}**`,
      ephemeral: true
    });
  }
};