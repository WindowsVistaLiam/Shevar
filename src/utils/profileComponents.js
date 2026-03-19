const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildProfileNavigationRow(targetUserId, slot, currentPage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`profile_page:${targetUserId}:${slot}:1`)
      .setLabel('1')
      .setStyle(currentPage === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`profile_page:${targetUserId}:${slot}:2`)
      .setLabel('2')
      .setStyle(currentPage === 2 ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`profile_page:${targetUserId}:${slot}:3`)
      .setLabel('3')
      .setStyle(currentPage === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`profile_prev:${targetUserId}:${slot}:${currentPage}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),

    new ButtonBuilder()
      .setCustomId(`profile_next:${targetUserId}:${slot}:${currentPage}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 3)
  );
}

function buildProfileSlotRow(targetUserId, currentSlot, existingSlots = []) {
  const sortedSlots = [...existingSlots].sort((a, b) => a - b);
  const currentIndex = sortedSlots.indexOf(currentSlot);

  const previousSlot = currentIndex > 0 ? sortedSlots[currentIndex - 1] : null;
  const nextSlot = currentIndex >= 0 && currentIndex < sortedSlots.length - 1
    ? sortedSlots[currentIndex + 1]
    : null;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        previousSlot
          ? `profile_slot:${targetUserId}:${previousSlot}:1`
          : `profile_slot_disabled_prev:${targetUserId}:${currentSlot}:1`
      )
      .setLabel('Slot précédent')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!previousSlot),

    new ButtonBuilder()
      .setCustomId(`profile_slot_current:${targetUserId}:${currentSlot}:1`)
      .setLabel(`Slot ${currentSlot}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(
        nextSlot
          ? `profile_slot:${targetUserId}:${nextSlot}:1`
          : `profile_slot_disabled_next:${targetUserId}:${currentSlot}:1`
      )
      .setLabel('Slot suivant')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!nextSlot)
  );
}

module.exports = {
  buildProfileNavigationRow,
  buildProfileSlotRow
};