const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { canManageReputation } = require('../../config/permissions');
const {
  clampMarketModifier,
  applyMarketModifier,
  formatModifier
} = require('../../utils/marketUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription("Modifier le marché d'un objet entre -10% et +10%")
    .addStringOption(option =>
      option
        .setName('item_id')
        .setDescription("Identifiant de l'objet boutique")
        .setRequired(true)
        .setMaxLength(50)
    )
    .addIntegerOption(option =>
      option
        .setName('variation')
        .setDescription('Variation de marché entre -10 et +10')
        .setRequired(true)
        .setMinValue(-10)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: "Tu n'as pas la permission d'utiliser cette commande.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const itemId = interaction.options.getString('item_id', true).trim().toLowerCase();
    const variation = clampMarketModifier(interaction.options.getInteger('variation', true));

    const item = await ShopItem.findOne({
      guildId: interaction.guildId,
      itemId
    });

    if (!item) {
      await interaction.reply({
        content: `Aucun objet trouvé avec l'ID **${itemId}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    item.marketModifier = variation;
    await item.save();

    const effectiveBuy = applyMarketModifier(item.buyPrice, item.marketModifier);
    const effectiveSell = applyMarketModifier(item.sellPrice, item.marketModifier);

    await interaction.reply({
      content: [
        `📈 Marché mis à jour pour **${item.name}**`,
        `ID : **${item.itemId}**`,
        `Variation : **${formatModifier(item.marketModifier)}**`,
        `Prix d'achat de base : **${item.buyPrice}**`,
        `Prix d'achat actuel : **${effectiveBuy}**`,
        `Prix de revente de base : **${item.sellPrice}**`,
        `Prix de revente actuel : **${effectiveSell}**`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};