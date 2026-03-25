const { EmbedBuilder } = require('discord.js');

const ITEMS_PER_PAGE = 5;

function getPageItems(items, page) {
  const safePage = Math.max(1, Number(page) || 1);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

function formatStock(stock) {
  return stock === -1 ? 'Illimité' : String(stock);
}

function buildPriceLines(item) {
  const currentBuyPrice =
    item.currentBuyPrice !== undefined ? item.currentBuyPrice : item.buyPrice;

  const currentSellPrice =
    item.currentSellPrice !== undefined ? item.currentSellPrice : item.sellPrice;

  const marketLabel = item.marketLabel || '0%';

  return [
    `💰 Achat : **${currentBuyPrice}**${currentBuyPrice !== item.buyPrice ? ` *(base ${item.buyPrice})*` : ''}`,
    `💸 Vente : **${currentSellPrice}**${currentSellPrice !== item.sellPrice ? ` *(base ${item.sellPrice})*` : ''}`,
    `📈 Marché : **${marketLabel}**`
  ].join('\n');
}

function buildItemBlock(item) {
  return [
    `### ${item.name}`,
    item.description || 'Aucune description.',
    '',
    buildPriceLines(item),
    `📦 Stock : **${formatStock(item.stock)}**`,
    `🆔 ID : \`${item.itemId}\``,
    item.equipable
      ? `🛡️ Équipable : **Oui**${item.equipmentSlot ? ` (${item.equipmentSlot})` : ''}`
      : `🛡️ Équipable : **Non**`
  ].join('\n');
}

function buildShopEmbed({ items, page = 1, totalPages = 1, category = null, guildName = 'Serveur RP' }) {
  const pageItems = getPageItems(items, page);

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(category ? `🛒 Boutique — ${category}` : '🛒 Boutique')
    .setDescription(
      pageItems.length > 0
        ? pageItems.map(buildItemBlock).join('\n\n')
        : 'Aucun article disponible.'
    )
    .setFooter({
      text: `${guildName} • Page ${page}/${totalPages}`
    })
    .setTimestamp();
}

module.exports = {
  ITEMS_PER_PAGE,
  buildShopEmbed
};