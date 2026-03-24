const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
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
    )
    .addBooleanOption(option =>
      option
        .setName('equipable')
        .setDescription('Cet article est-il équipable ?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('slot_equipement')
        .setDescription('Slot d’équipement si équipable')
        .setRequired(false)
        .addChoices(
          { name: 'Tête', value: 'tete' },
          { name: 'Torse', value: 'torse' },
          { name: 'Jambes', value: 'jambes' },
          { name: 'Pieds', value: 'pieds' },
          { name: 'Main droite', value: 'mainDroite' },
          { name: 'Main gauche', value: 'mainGauche' },
          { name: 'Accessoire 1', value: 'accessoire1' },
          { name: 'Accessoire 2', value: 'accessoire2' }
        )
    )
    .addStringOption(option =>
      option
        .setName('icone')
        .setDescription('Nom du fichier icône dans src/assets/inventory/items/')
        .setRequired(false)
        .setMaxLength(100)
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

    const equipable = interaction.options.getBoolean('equipable', true);
    const equipmentSlot = interaction.options.getString('slot_equipement') || '';
    const icon = (interaction.options.getString('icone') || '').trim();

    if (equipable && !equipmentSlot) {
      await interaction.reply({
        content: 'Tu dois préciser un **slot d’équipement** si l’article est équipable.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!equipable && equipmentSlot) {
      await interaction.reply({
        content: 'Tu as renseigné un **slot d’équipement** alors que l’article n’est pas équipable.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const item = await ShopItem.findOneAndUpdate(
      { guildId: interaction.guildId, itemId },
      {
        guildId: interaction.guildId,
        itemId,
        name,
        description,
        category,
        buyPrice,
        sellPrice,
        stock,
        isActive,
        equipable,
        equipmentSlot: equipable ? equipmentSlot : '',
        icon: equipable ? icon : ''
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content: [
        `✅ Article enregistré : **${item.name}**`,
        `ID : **${item.itemId}**`,
        `Achat : **${item.buyPrice}**`,
        `Vente : **${item.sellPrice}**`,
        `Stock : **${item.stock === -1 ? 'Illimité' : item.stock}**`,
        `Actif : **${item.isActive ? 'Oui' : 'Non'}**`,
        `Équipable : **${item.equipable ? 'Oui' : 'Non'}**`,
        `Slot : **${item.equipmentSlot || 'Aucun'}**`,
        `Icône : **${item.icon || 'Aucune'}**`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};