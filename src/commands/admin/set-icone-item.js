const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const Profile = require('../../models/Profile');

function isValidImageAttachment(attachment) {
  if (!attachment) return false;
  return attachment.contentType?.startsWith('image/');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-icone-item')
    .setDescription("Modifier uniquement l'icône d'un item existant")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addStringOption(option =>
      option
        .setName('item_id')
        .setDescription("Identifiant de l'item boutique")
        .setRequired(true)
        .setMaxLength(50)
    )
    .addStringOption(option =>
      option
        .setName('icone')
        .setDescription('Ancien nom de fichier local (optionnel)')
        .setRequired(false)
        .setMaxLength(100)
    )
    .addStringOption(option =>
      option
        .setName('icone_url')
        .setDescription("URL directe de l'icône")
        .setRequired(false)
        .setMaxLength(500)
    )
    .addAttachmentOption(option =>
      option
        .setName('icone_fichier')
        .setDescription('Image envoyée directement dans Discord')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('synchroniser_profils')
        .setDescription("Mettre aussi à jour les objets déjà achetés dans les profils")
        .setRequired(false)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getString('item_id', true).trim().toLowerCase();
    const localIcon = (interaction.options.getString('icone') || '').trim();
    const iconUrlOption = (interaction.options.getString('icone_url') || '').trim();
    const iconAttachment = interaction.options.getAttachment('icone_fichier');
    const syncProfiles = interaction.options.getBoolean('synchroniser_profils') ?? true;

    if (iconAttachment && !isValidImageAttachment(iconAttachment)) {
      await interaction.reply({
        content: "Le fichier fourni doit être une image valide.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    let iconUrl = '';
    if (iconAttachment) {
      iconUrl = iconAttachment.url;
    } else if (iconUrlOption) {
      iconUrl = iconUrlOption;
    }

    if (!localIcon && !iconUrl) {
      await interaction.reply({
        content: "Tu dois fournir soit `icone_fichier`, soit `icone_url`, soit `icone`.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const shopItem = await ShopItem.findOne({
      guildId: interaction.guildId,
      itemId
    });

    if (!shopItem) {
      await interaction.reply({
        content: `Aucun item boutique trouvé avec l'ID **${itemId}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const oldLocalIcon = shopItem.icon || '';
    const oldIconUrl = shopItem.iconUrl || '';

    shopItem.icon = localIcon || '';
    shopItem.iconUrl = iconUrl || '';

    await shopItem.save();

    let updatedProfiles = 0;
    let updatedInventoryEntries = 0;
    let updatedEquippedEntries = 0;

    if (syncProfiles) {
      const profiles = await Profile.find({
        guildId: interaction.guildId
      });

      for (const profile of profiles) {
        let changed = false;

        for (const item of profile.inventory) {
          const sameName = item.name.toLowerCase() === shopItem.name.toLowerCase();
          const sameEquipable = Boolean(item.equipable) === Boolean(shopItem.equipable);
          const sameSlot = (item.equipmentSlot || '') === (shopItem.equipmentSlot || '');

          if (sameName && sameEquipable && sameSlot) {
            item.icon = shopItem.icon || '';
            item.iconUrl = shopItem.iconUrl || '';
            updatedInventoryEntries += 1;
            changed = true;
          }
        }

        if (profile.equippedItems) {
          for (const [slotKey, equipped] of Object.entries(profile.equippedItems)) {
            if (!equipped || !equipped.itemNameSnapshot) continue;

            const sameEquippedName =
              equipped.itemNameSnapshot.toLowerCase() === shopItem.name.toLowerCase();

            if (sameEquippedName) {
              profile.equippedItems[slotKey].icon = shopItem.icon || '';
              profile.equippedItems[slotKey].iconUrl = shopItem.iconUrl || '';
              updatedEquippedEntries += 1;
              changed = true;
            }
          }
        }

        if (changed) {
          await profile.save();
          updatedProfiles += 1;
        }
      }
    }

    await interaction.reply({
      content: [
        `✅ Icône mise à jour pour **${shopItem.name}**`,
        `ID : **${shopItem.itemId}**`,
        `Ancienne icône locale : **${oldLocalIcon || 'Aucune'}**`,
        `Nouvelle icône locale : **${shopItem.icon || 'Aucune'}**`,
        `Ancienne icône URL : **${oldIconUrl || 'Aucune'}**`,
        `Nouvelle icône URL : **${shopItem.iconUrl || 'Aucune'}**`,
        '',
        `Synchronisation profils : **${syncProfiles ? 'Oui' : 'Non'}**`,
        syncProfiles
          ? `Profils modifiés : **${updatedProfiles}**\nEntrées inventaire modifiées : **${updatedInventoryEntries}**\nÉquipements modifiés : **${updatedEquippedEntries}**`
          : 'Aucune synchronisation des profils.'
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};