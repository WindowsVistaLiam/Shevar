const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('supprimer-boutique-item')
    .setDescription('Supprime un article de la boutique')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('item_id')
        .setDescription('Identifiant de l’article')
        .setRequired(true)
        .setMaxLength(50)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getString('item_id', true).trim().toLowerCase();

    const item = await ShopItem.findOneAndDelete({
      guildId: interaction.guildId,
      itemId
    });

    if (!item) {
      await interaction.reply({
        content: `Aucun article trouvé avec l’ID **${itemId}**.`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: `✅ Article supprimé : **${item.name}** (${item.itemId})`,
      ephemeral: true
    });
  }
};