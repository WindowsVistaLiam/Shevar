const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { getActiveSlot, getProfileBySlot } = require('../../services/profileService');
const { applyMarketModifier, formatModifier } = require('../../utils/marketUtils');

const EQUIPMENT_SLOTS = [
  'tete',
  'torse',
  'jambes',
  'pieds',
  'mainDroite',
  'mainGauche',
  'accessoire1',
  'accessoire2'
];

function unequipSoldItemIfNeeded(profile, inventoryItem) {
  if (!profile?.equippedItems || !inventoryItem) return [];

  const unequippedSlots = [];

  for (const slot of EQUIPMENT_SLOTS) {
    const equipped = profile.equippedItems?.[slot];
    if (!equipped) continue;

    const sameInventoryId =
      equipped.inventoryItemId &&
      inventoryItem._id &&
      String(equipped.inventoryItemId) === String(inventoryItem._id);

    const sameFallbackIdentity =
      equipped.itemNameSnapshot &&
      equipped.itemNameSnapshot.toLowerCase() === inventoryItem.name.toLowerCase() &&
      (equipped.icon || '') === (inventoryItem.icon || '') &&
      (equipped.iconUrl || '') === (inventoryItem.iconUrl || '');

    if (sameInventoryId || sameFallbackIdentity) {
      profile.equippedItems[slot] = {
        inventoryItemId: null,
        itemNameSnapshot: '',
        icon: '',
        iconUrl: ''
      };

      unequippedSlots.push(slot);
    }
  }

  return unequippedSlots;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vendre')
    .setDescription('Vendre un objet de ton inventaire à la boutique')
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
        .setDescription('Quantité à vendre')
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

    const inventoryItem = profile.inventory.find(entry =>
      entry.name.toLowerCase() === item.name.toLowerCase() &&
      Boolean(entry.equipable) === Boolean(item.equipable) &&
      (entry.equipmentSlot || '') === (item.equipmentSlot || '') &&
      (entry.icon || '') === (item.icon || '') &&
      (entry.iconUrl || '') === (item.iconUrl || '')
    );

    if (!inventoryItem) {
      await interaction.reply({
        content: `Tu ne possèdes pas **${item.name}** sur ton profil actif.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (inventoryItem.quantity < quantity) {
      await interaction.reply({
        content: [
          `Tu n'as pas assez de **${item.name}**.`,
          `Quantité disponible : **${inventoryItem.quantity}**.`
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const currentSellPrice = applyMarketModifier(item.sellPrice, item.marketModifier);
    const totalPrice = currentSellPrice * quantity;

    inventoryItem.quantity -= quantity;

    let unequippedSlots = [];

    if (inventoryItem.quantity <= 0) {
      unequippedSlots = unequipSoldItemIfNeeded(profile, inventoryItem);

      profile.inventory = profile.inventory.filter(entry => {
        return !(
          entry.name.toLowerCase() === inventoryItem.name.toLowerCase() &&
          Boolean(entry.equipable) === Boolean(inventoryItem.equipable) &&
          (entry.equipmentSlot || '') === (inventoryItem.equipmentSlot || '') &&
          (entry.icon || '') === (inventoryItem.icon || '') &&
          (entry.iconUrl || '') === (inventoryItem.iconUrl || '')
        );
      });
    }

    profile.wallet = (profile.wallet || 0) + totalPrice;

    if (item.stock !== -1) {
      item.stock += quantity;
      await item.save();
    }

    await profile.save();

    await interaction.reply({
      content: [
        `✅ Vente effectuée : **${item.name}** ×${quantity}`,
        `Variation marché : **${formatModifier(item.marketModifier || 0)}**`,
        `Prix unitaire actuel : **${currentSellPrice}** Crawns`,
        `💰 Gain total : **${totalPrice}** Crawns`,
        `🪙 Nouveau portefeuille : **${profile.wallet}** Crawns`,
        unequippedSlots.length > 0
          ? `🛡️ Déséquipé automatiquement depuis : **${unequippedSlots.join(', ')}**`
          : null
      ].filter(Boolean).join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};