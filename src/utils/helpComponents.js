const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildHelpNavigationRow(page = 1) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev:${page}`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`help_page:${page}`)
      .setLabel(`Page ${page}/3`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`help_next:${page}`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= 3)
  );
}

module.exports = { buildHelpNavigationRow };  