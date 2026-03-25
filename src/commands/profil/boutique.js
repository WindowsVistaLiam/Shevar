const { SlashCommandBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { ITEMS_PER_PAGE, buildShopEmbed } = require('../../utils/shopEmbeds');
const {
  buildShopNavigationRow,
  buildShopCategoryRow
} = require('../../utils/shopComponents');

const {
  applyMarketModifier,
  formatModifier
} = require('../../utils/marketUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Afficher les articles disponibles en boutique')
    .addStringOption(option =>
      option
        .setName('categorie')
        .setDescription('Filtrer par catégorie')
        .setRequired(false)
        .setMaxLength(50)
    ),

  async execute(interaction) {
    const requestedCategory = interaction.options.getString('categorie');

    const allActiveItems = await ShopItem.find({
      guildId: interaction.guildId,
      isActive: true
    }).sort({ category: 1, name: 1 }).lean();

    if (allActiveItems.length === 0) {
      await interaction.reply({
        content: 'Aucun article actif en boutique.',
        ephemeral: true
      });
      return;
    }

    const categories = [...new Set(allActiveItems.map(item => item.category).filter(Boolean))];

    const category = requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : 'all';

    const filteredItems = category === 'all'
      ? allActiveItems
      : allActiveItems.filter(item => item.category === category);

    if (filteredItems.length === 0) {
      await interaction.reply({
        content: `Aucun article actif dans la catégorie **${requestedCategory}**.`,
        ephemeral: true
      });
      return;
    }

    // 🔥 APPLICATION DU MARCHÉ ICI
    const items = filteredItems.map(item => {
      const buy = applyMarketModifier(item.buyPrice, item.marketModifier);
      const sell = applyMarketModifier(item.sellPrice, item.marketModifier);

      return {
        ...item,

        // prix modifiés
        currentBuyPrice: buy,
        currentSellPrice: sell,

        // affichage propre
        marketLabel: formatModifier(item.marketModifier || 0)
      };
    });

    const page = 1;
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

    const embed = buildShopEmbed({
      items,
      page,
      totalPages,
      category: category === 'all' ? null : category,
      guildName: interaction.guild?.name || 'Serveur RP'
    });

    const components = [
      buildShopCategoryRow(categories, category),
      buildShopNavigationRow(page, totalPages, category)
    ];

    await interaction.reply({
      embeds: [embed],
      components
    });
  }
};