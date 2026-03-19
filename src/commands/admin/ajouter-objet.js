const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-objet')
    .setDescription('Ajoute un objet à l’inventaire d’un joueur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Nom de l’objet')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('Quantité à ajouter')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const nom = interaction.options.getString('nom', true).trim();
    const quantite = interaction.options.getInteger('quantite', true);

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

    const existingItem = profile.inventory.find(
      item => item.name.toLowerCase() === nom.toLowerCase()
    );

    if (existingItem) {
      existingItem.quantity += quantite;
    } else {
      profile.inventory.push({
        name: nom,
        quantity: quantite
      });
    }

    await profile.save();

    await interaction.reply({
      content: `✅ Objet ajouté à **${targetUser.username}** : **${nom}** ×${quantite}`,
      ephemeral: true
    });
  }
};