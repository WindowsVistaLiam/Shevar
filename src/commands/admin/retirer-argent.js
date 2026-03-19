const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirer-argent')
    .setDescription('Retire de l’argent du portefeuille d’un joueur')
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
        .setDescription('Le montant à retirer')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const montant = interaction.options.getInteger('montant', true);

    let profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id
    });

    if (!profile) {
      profile = await Profile.create({
        guildId: interaction.guildId,
        userId: targetUser.id
      });
    }

    profile.wallet = Math.max(0, (profile.wallet || 0) - montant);
    await profile.save();

    await interaction.reply({
      content: `✅ **${montant}** pièces ont été retirées à **${targetUser.username}**.\nPortefeuille actuel : **${profile.wallet}** pièces.`,
      ephemeral: true
    });
  }
};