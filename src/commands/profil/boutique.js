const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

function truncate(text, maxLength) {
  if (!text) return 'Aucune description.';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

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
    const category = interaction.options.getString('categorie');

    const query = {
      guildId: interaction.guildId,
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    const items = await ShopItem.find(query).sort({ category: 1, name: 1 }).lean();

    if (items.length === 0) {
      await interaction.reply({
        content: category
          ? `Aucun article actif dans la catégorie **${category}**.`
          : 'Aucun article actif en boutique.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🛒 Boutique')
      .setDescription(
        items
          .slice(0, 20)
          .map(item =>
            [
              `**${item.name}** \`(${item.itemId})\``,
              `${truncate(item.description, 120)}`,
              `💰 Achat : **${item.buyPrice}** • 💸 Vente : **${item.sellPrice}** • 📦 Stock : **${item.stock === -1 ? 'Illimité' : item.stock}** • 🗂️ ${item.category}`
            ].join('\n')
          )
          .join('\n\n')
      )
      .setFooter({
        text: items.length > 20
          ? `Affichage des 20 premiers articles sur ${items.length}`
          : `${items.length} article(s)`
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};