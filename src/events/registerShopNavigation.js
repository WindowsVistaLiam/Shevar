const ShopItem = require('../models/ShopItem');
const { ITEMS_PER_PAGE, buildShopEmbed } = require('../utils/shopEmbeds');
const {
  buildShopNavigationRow,
  buildShopCategoryRow
} = require('../utils/shopComponents');

async function getActiveCategories(guildId) {
  const items = await ShopItem.find({
    guildId,
    isActive: true
  }).sort({ category: 1, name: 1 }).lean();

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  return categories;
}

async function getItemsForCategory(guildId, category) {
  const query = {
    guildId,
    isActive: true
  };

  if (category && category !== 'all') {
    query.category = category;
  }

  return ShopItem.find(query).sort({ category: 1, name: 1 }).lean();
}

module.exports = function registerShopNavigation(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isButton()) {
        if (
          !interaction.customId.startsWith('shop_prev:') &&
          !interaction.customId.startsWith('shop_next:')
        ) {
          return;
        }

        const [action, rawCategory, rawPage] = interaction.customId.split(':');
        const category = rawCategory === 'all' ? 'all' : rawCategory;
        let page = Number(rawPage) || 1;

        const items = await getItemsForCategory(interaction.guildId, category);
        const categories = await getActiveCategories(interaction.guildId);
        const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

        if (action === 'shop_prev') {
          page = Math.max(1, page - 1);
        }

        if (action === 'shop_next') {
          page = Math.min(totalPages, page + 1);
        }

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

        await interaction.update({
          embeds: [embed],
          components
        });

        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (!interaction.customId.startsWith('shop_category:')) return;

        const selectedCategory = interaction.values[0] || 'all';
        const items = await getItemsForCategory(interaction.guildId, selectedCategory);
        const categories = await getActiveCategories(interaction.guildId);
        const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
        const page = 1;

        const embed = buildShopEmbed({
          items,
          page,
          totalPages,
          category: selectedCategory === 'all' ? null : selectedCategory,
          guildName: interaction.guild?.name || 'Serveur RP'
        });

        const components = [
          buildShopCategoryRow(categories, selectedCategory),
          buildShopNavigationRow(page, totalPages, selectedCategory)
        ];

        await interaction.update({
          embeds: [embed],
          components
        });
      }
    } catch (error) {
      console.error('❌ Erreur navigation boutique :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation de la boutique.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation de la boutique.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};