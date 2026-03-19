const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-boutique-item')
    .setDescription('Créer ou modifier un article de la boutique')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('item_id')
        .setDescription('Identifiant unique de l’article')
        .setRequired(true)
        .setMaxLength(50)
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Nom de l’article')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Description de l’article')
        .setRequired(true)
        .setMaxLength(500)
    )
    .addStringOption(option =>
      option
        .setName('categorie')
        .setDescription('Catégorie de l’article')
        .setRequired(true)
        .setMaxLength(50)
    )
    .addIntegerOption(option =>
      option
        .setName('prix_achat')
        .setDescription('Prix d’achat')
        .setRequired(true)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName('prix_vente')
        .setDescription('Prix de vente')
        .setRequired(true)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName('stock')
        .setDescription('Stock (-1 = illimité)')
        .setRequired(true)
        .setMinValue(-1)
    )
    .addBooleanOption(option =>
      option
        .setName('actif')
        .setDescription('Article actif ou non')
        .setRequired(true)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getString('item_id', true).trim().toLowerCase();
    const name = interaction.options.getString('nom', true).trim();
    const description = interaction.options.getString('description', true).trim();
    const category = interaction.options.getString('categorie', true).trim();
    const buyPrice = interaction.options.getInteger('prix_achat', true);
    const sellPrice = interaction.options.getInteger('prix_vente', true);
    const stock = interaction.options.getInteger('stock', true);
    const isActive = interaction.options.getBoolean('actif', true);

    const item = await ShopItem.findOneAndUpdate(
      {
        guildId: interaction.guildId,
        itemId
      },
      {
        guildId: interaction.guildId,
        itemId,
        name,
        description,
        category,
        buyPrice,
        sellPrice,
        stock,
        isActive
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content:
        `✅ Article enregistré : **${item.name}**\n` +
        `ID : **${item.itemId}**\n` +
        `Achat : **${item.buyPrice}**\n` +
        `Vente : **${item.sellPrice}**\n` +
        `Stock : **${item.stock === -1 ? 'Illimité' : item.stock}**\n` +
        `Actif : **${item.isActive ? 'Oui' : 'Non'}**`,
      ephemeral: true
    });
  }
};