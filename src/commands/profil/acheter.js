const { SlashCommandBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { getActiveSlot, getProfileBySlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('acheter')
    .setDescription('Acheter un article de la boutique')
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

    if (item.stock !== -1 && item.stock < quantity) {
      await interaction.reply({
        content: `Stock insuffisant pour **${item.name}**. Stock actuel : **${item.stock}**.`,
        ephemeral: true
      });
      return;
    }

    const totalPrice = item.buyPrice * quantity;

    if ((profile.wallet || 0) < totalPrice) {
      await interaction.reply({
        content:
          `Tu n’as pas assez d’argent sur ton **profil actif (slot ${slot})**.\n` +
          `Prix total : **${totalPrice}** pièces\n` +
          `Portefeuille actuel : **${profile.wallet || 0}** pièces.`,
        ephemeral: true
      });
      return;
    }

    profile.wallet -= totalPrice;

    const existingItem = profile.inventory.find(
      entry => entry.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      profile.inventory.push({
        name: item.name,
        quantity
      });
    }

    if (item.stock !== -1) {
      item.stock -= quantity;
      await item.save();
    }

    await profile.save();

    await interaction.reply({
      content:
        `🛒 Achat effectué : **${item.name}** ×${quantity}\n` +
        `💰 Coût total : **${totalPrice}** pièces\n` +
        `👛 Portefeuille restant : **${profile.wallet}** pièces`,
      ephemeral: true
    });
  }
};