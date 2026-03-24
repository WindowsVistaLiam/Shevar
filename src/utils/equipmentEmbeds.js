const { EmbedBuilder } = require('discord.js');
const { SLOT_LABELS, buildEquipmentSummary } = require('./inventoryCanvas');

function getEquipableItemsForSlot(profile, slot) {
  return (profile.inventory || []).filter(item =>
    item.equipable === true &&
    item.quantity > 0 &&
    item.equipmentSlot === slot
  );
}

function buildEquipmentPanelEmbed(profile, user) {
  return new EmbedBuilder()
    .setColor(0x1abc9c)
    .setAuthor({
      name: `Équipement de ${user.username}`,
      iconURL: user.displayAvatarURL({ size: 256 })
    })
    .setTitle(`🛡️ ${profile.nomPrenom || 'Personnage sans nom'} • Slot ${profile.slot}`)
    .setDescription('Choisis un slot pour équiper un objet, ou déséquipe un slot existant.')
    .addFields(
      {
        name: 'Slots équipés',
        value: buildEquipmentSummary(profile),
        inline: false
      },
      {
        name: 'Slots disponibles',
        value: Object.entries(SLOT_LABELS)
          .map(([slotKey, label]) => {
            const count = getEquipableItemsForSlot(profile, slotKey).length;
            return `• **${label}** : ${count} objet(s) compatible(s)`;
          })
          .join('\n'),
        inline: false
      }
    )
    .setTimestamp();
}

module.exports = {
  buildEquipmentPanelEmbed,
  getEquipableItemsForSlot
};