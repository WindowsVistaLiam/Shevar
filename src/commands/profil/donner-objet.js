const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donner-objet')
    .setDescription('Donner un objet de ton inventaire à un autre joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur qui reçoit l’objet')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Le nom de l’objet à donner')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('La quantité à donner')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const nom = interaction.options.getString('nom', true).trim();
    const quantite = interaction.options.getInteger('quantite', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'Tu ne peux pas te donner un objet à toi-même.',
        ephemeral: true
      });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({
        content: 'Tu ne peux pas donner un objet à un bot.',
        ephemeral: true
      });
      return;
    }

    const senderProfile = await Profile.findOne({
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

    const senderItem = senderProfile.inventory.find(
      item => item.name.toLowerCase() === nom.toLowerCase()
    );

    if (!senderItem) {
      await interaction.reply({
        content: `Tu ne possèdes pas l’objet **${nom}**.`,
        ephemeral: true
      });
      return;
    }

    if (senderItem.quantity < quantite) {
      await interaction.reply({
        content:
          `Tu n’as pas assez de **${nom}**.\n` +
          `Quantité disponible : **${senderItem.quantity}**.`,
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

    senderItem.quantity -= quantite;

    if (senderItem.quantity <= 0) {
      senderProfile.inventory = senderProfile.inventory.filter(
        item => item.name.toLowerCase() !== nom.toLowerCase()
      );
    }

    const receiverItem = receiverProfile.inventory.find(
      item => item.name.toLowerCase() === nom.toLowerCase()
    );

    if (receiverItem) {
      receiverItem.quantity += quantite;
    } else {
      receiverProfile.inventory.push({
        name: nom,
        quantity: quantite
      });
    }

    await senderProfile.save();
    await receiverProfile.save();

    await interaction.reply({
      content:
        `✅ Tu as donné **${nom}** ×${quantite} à **${targetUser.username}**.\n` +
        `Transfert effectué avec succès.`,
      ephemeral: true
    });
  }
};