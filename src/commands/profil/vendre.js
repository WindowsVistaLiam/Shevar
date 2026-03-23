const { SlashCommandBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { getActiveSlot, getProfileBySlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vendre')
    .setDescription('Vendre un objet de ton inventaire à la boutique')
    .addStringOption(option =>
      option
        .setName('item_id')
        .setDescription('Identifiant de l’article')
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
        content: 'Tu n’as pas encore de profil actif valide.',
        ephemeral: true
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
        content: `Aucun article actif trouvé avec l’ID **${itemId}**.`,
        ephemeral: true
      });
      return;
    }

    const inventoryItem = profile.inventory.find(
      entry => entry.name.toLowerCase() === item.name.toLowerCase()
    );

    if (!inventoryItem) {
      await interaction.reply({
        content: `Tu ne possèdes pas **${item.name}** sur ton profil actif.`,
        ephemeral: true
      });
      return;
    }

    if (inventoryItem.quantity < quantity) {
      await interaction.reply({
        content:
          `Tu n’as pas assez de **${item.name}**.\n` +
          `Quantité disponible : **${inventoryItem.quantity}**.`,
        ephemeral: true
      });
      return;
    }

    const totalPrice = item.sellPrice * quantity;

    inventoryItem.quantity -= quantity;

    if (inventoryItem.quantity <= 0) {
      profile.inventory = profile.inventory.filter(
        entry => entry.name.toLowerCase() !== item.name.toLowerCase()
      );
    }

    profile.wallet = (profile.wallet || 0) + totalPrice;

    if (item.stock !== -1) {
      item.stock += quantity;
      await item.save();
    }

    await profile.save();

    await interaction.reply({
      content:
        `💸 Vente effectuée : **${item.name}** ×${quantity}\n` +
        `💰 Gain total : **${totalPrice}** Crawns\n` +
        `👛 Nouveau portefeuille : **${profile.wallet}** Crawns`,
      ephemeral: true
    });
  }
};