const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { formatRelationType, getRelationTargetName } = require('./relationEmbeds');

function shorten(text, max = 100) {
  if (!text) return 'Non renseigné';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function buildRelationRows(ownerUserId, slot, page, totalPages, currentPageRelations = []) {
  const rows = [];

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`relation_prev:${ownerUserId}:${slot}:${page}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),

      new ButtonBuilder()
        .setCustomId(`relation_next:${ownerUserId}:${slot}:${page}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages),

      new ButtonBuilder()
        .setCustomId(`relation_add:${ownerUserId}:${slot}:${page}`)
        .setLabel('Ajouter')
        .setEmoji('➕')
        .setStyle(ButtonStyle.Success)
    )
  );

  if (currentPageRelations.length > 0) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`relation_detail_select:${ownerUserId}:${slot}:${page}`)
          .setPlaceholder('Voir le détail d’une relation')
          .addOptions(
            currentPageRelations.map(relation => {
              const targetName = getRelationTargetName(relation);

              return {
                label: shorten(`${formatRelationType(relation.type)} — ${targetName}`, 100),
                description: shorten(relation.description || 'Aucune description', 100),
                value: String(relation._id),
              };
            })
          )
      )
    );

    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`relation_delete_select:${ownerUserId}:${slot}:${page}`)
          .setPlaceholder('Supprimer une relation')
          .addOptions(
            currentPageRelations.map(relation => {
              const targetName = getRelationTargetName(relation);

              return {
                label: shorten(`${formatRelationType(relation.type)} — ${targetName}`, 100),
                description: 'Supprimer cette relation',
                value: String(relation._id),
              };
            })
          )
      )
    );
  }

  return rows;
}

module.exports = { buildRelationRows };