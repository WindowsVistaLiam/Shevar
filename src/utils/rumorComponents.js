const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function shorten(text, max = 100) {
  if (!text) return 'Sans contenu';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function buildRumorRows(ownerUserId, slot, mode, page, totalPages, currentPageRumors = []) {
  const toggleMode = mode === 'mine' ? 'all' : 'mine';

  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rumor_prev:${ownerUserId}:${slot}:${mode}:${page}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`rumor_next:${ownerUserId}:${slot}:${mode}:${page}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages),
      new ButtonBuilder()
        .setCustomId(`rumor_toggle:${ownerUserId}:${slot}:${mode}:${page}`)
        .setLabel(toggleMode === 'mine' ? 'Mes rumeurs' : 'Toutes')
        .setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rumor_publish_anon:${ownerUserId}:${slot}:${mode}:${page}`)
        .setLabel('Publier anonymement')
        .setEmoji('🎭')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rumor_publish_named:${ownerUserId}:${slot}:${mode}:${page}`)
        .setLabel('Publier avec le profil')
        .setEmoji('🪪')
        .setStyle(ButtonStyle.Success)
    )
  ];

  if (currentPageRumors.length > 0) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`rumor_detail_select:${ownerUserId}:${slot}:${mode}:${page}`)
          .setPlaceholder('Voir le détail d’une rumeur')
          .addOptions(
            currentPageRumors.map(rumor => ({
              label: shorten(
                rumor.anonymous
                  ? 'Anonyme'
                  : (rumor.authorProfileNameSnapshot || 'Profil inconnu'),
                100
              ),
              description: shorten(rumor.content, 100),
              value: String(rumor._id)
            }))
          )
      )
    );
  }

  return rows;
}

function buildPublishedRumorRows(rumorId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rumor_believe:${rumorId}`)
        .setLabel('Croire')
        .setEmoji('👍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`rumor_deny:${rumorId}`)
        .setLabel('Nier')
        .setEmoji('👎')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

module.exports = {
  buildRumorRows,
  buildPublishedRumorRows
};