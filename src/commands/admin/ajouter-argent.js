const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-argent')
    .setDescription('Ajoute de l’argent au portefeuille d’un joueur')
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
        .setDescription('Le montant à ajouter')
        .setRequired(true)
        .setMinValue(1)
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
        $setOnInsert: {
          guildId: interaction.guildId,
          userId: targetUser.id
        },
        $inc: {
          wallet: montant
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content: `✅ **${montant}** pièces ont été ajoutées à **${targetUser.username}**.\nPortefeuille actuel : **${profile.wallet}** pièces.`,
      ephemeral: true
    });
  }
};