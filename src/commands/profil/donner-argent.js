const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donner-argent')
    .setDescription('Donner de l’argent à un autre joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur qui reçoit l’argent')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('montant')
        .setDescription('Le montant à donner')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const montant = interaction.options.getInteger('montant', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'Tu ne peux pas te donner de l’argent à toi-même.',
        ephemeral: true
      });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({
        content: 'Tu ne peux pas donner de l’argent à un bot.',
        ephemeral: true
      });
      return;
    }

    let senderProfile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id
    });

    if (!senderProfile) {
      await interaction.reply({
        content: 'Tu n’as pas encore de profil. Utilise `/profil` pour le créer.',
        ephemeral: true
      });
      return;
    }

    if ((senderProfile.wallet || 0) < montant) {
      await interaction.reply({
        content: `Tu n’as pas assez d’argent. Ton portefeuille actuel est de **${senderProfile.wallet || 0}** pièces.`,
        ephemeral: true
      });
      return;
    }

    let receiverProfile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id
    });

    if (!receiverProfile) {
      receiverProfile = await Profile.create({
        guildId: interaction.guildId,
        userId: targetUser.id
      });
    }

    senderProfile.wallet -= montant;
    receiverProfile.wallet = (receiverProfile.wallet || 0) + montant;

    await senderProfile.save();
    await receiverProfile.save();

    await interaction.reply({
      content:
        `✅ Tu as donné **${montant}** pièces à **${targetUser.username}**.\n` +
        `Ton nouveau portefeuille : **${senderProfile.wallet}** pièces.`,
      ephemeral: true
    });
  }
};