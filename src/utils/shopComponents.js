const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function buildShopNavigationRow(page, totalPages, category = 'all') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev:${category}:${page}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`shop_pageinfo:${category}:${page}`)
      .setLabel(`Page ${page}/${Math.max(totalPages, 1)}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`shop_next:${category}:${page}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}

function buildShopCategoryRow(categories = [], selectedCategory = 'all') {
  const options = [
    {
      label: 'Toutes les catégories',
      value: 'all',
      default: selectedCategory === 'all'
    },
    ...categories.slice(0, 24).map(category => ({
      label: category,
      value: category,
      default: selectedCategory === category
    }))
  ];

  const select = new StringSelectMenuBuilder()
    .setCustomId(`shop_category:${selectedCategory}`)
    .setPlaceholder('Choisir une catégorie')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

module.exports = {
  buildShopNavigationRow,
  buildShopCategoryRow
};