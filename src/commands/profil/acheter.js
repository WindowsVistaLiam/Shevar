const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { getActiveSlot, getProfileBySlot } = require('../../services/profileService');
const { applyMarketModifier, formatModifier } = require('../../utils/marketUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('acheter')
    .setDescription('Acheter un article de la boutique')
    .addStringOption(option =>
      option
        .setName('item_id')
        .setDescription("Identifiant de l'article")
        .setRequired(true)
        .setMaxLength(50)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('Quantité à acheter')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getString('item_id', true).trim().toLowerCase();
    const quantity = interaction.options.getInteger('quantite', true);

    const slot = await getActiveSlot(interaction.guildId, interaction.user.id);
    const profile = await getProfileBySlot(interaction.guildId, interaction.user.id, slot);

    if (!profile) {
      await interaction.reply({
        content: "Tu n'as pas encore de profil actif valide.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const item = await ShopItem.findOne({
      guildId: interaction.guildId,
      itemId,
      isActive: true
    });

    if (!item) {
      await interaction.reply({
        content: `Aucun article actif trouvé avec l'ID **${itemId}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (item.stock !== -1 && item.stock < quantity) {
      await interaction.reply({
        content: `Stock insuffisant pour **${item.name}**.\nStock actuel : **${item.stock}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const currentBuyPrice = applyMarketModifier(item.buyPrice, item.marketModifier);
    const totalPrice = currentBuyPrice * quantity;

    if ((profile.wallet || 0) < totalPrice) {
      await interaction.reply({
        content: [
          `Tu n'as pas assez d'argent sur ton **profil actif (slot ${slot})**.`,
          `Prix unitaire actuel : **${currentBuyPrice}** Crawns`,
          `Prix total : **${totalPrice}** Crawns`,
          `Portefeuille actuel : **${profile.wallet || 0}** Crawns`
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    profile.wallet -= totalPrice;

    const existingItem = profile.inventory.find(
      entry =>
        entry.name.toLowerCase() === item.name.toLowerCase() &&
        Boolean(entry.equipable) === Boolean(item.equipable) &&
        (entry.equipmentSlot || '') === (item.equipmentSlot || '') &&
        (entry.icon || '') === (item.icon || '') &&
        (entry.iconUrl || '') === (item.iconUrl || '')
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      profile.inventory.push({
        name: item.name,
        quantity,
        equipable: item.equipable || false,
        equipmentSlot: item.equipable ? (item.equipmentSlot || '') : '',
        icon: item.equipable ? (item.icon || '') : '',
        iconUrl: item.equipable ? (item.iconUrl || '') : ''
      });
    }

    if (item.stock !== -1) {
      item.stock -= quantity;
      await item.save();
    }

    await profile.save();

    await interaction.reply({
      content: [
        `✅ Achat effectué : **${item.name}** ×${quantity}`,
        `Variation marché : **${formatModifier(item.marketModifier || 0)}**`,
        `Prix unitaire actuel : **${currentBuyPrice}** Crawns`,
        `Coût total : **${totalPrice}** Crawns`,
        `Portefeuille restant : **${profile.wallet}** Crawns`,
        `Équipable : **${item.equipable ? 'Oui' : 'Non'}**${item.equipable ? ` (${item.equipmentSlot})` : ''}`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};