const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-portefeuille')
    .setDescription('Définit le montant du portefeuille d’un joueur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('montant')
        .setDescription('Le nouveau montant')
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const montant = interaction.options.getInteger('montant', true);

    const profile = await Profile.findOneAndUpdate(
      {
        guildId: interaction.guildId,
        userId: targetUser.id
      },
      {
        guildId: interaction.guildId,
        userId: targetUser.id,
        wallet: montant
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content: `✅ Le portefeuille de **${targetUser.username}** est maintenant de **${profile.wallet}** pièces.`,
      ephemeral: true
    });
  }
};