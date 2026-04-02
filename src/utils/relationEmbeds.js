const { EmbedBuilder } = require('discord.js');

const MAX_RELATIONS_PER_PROFILE = 25;
const RELATIONS_PER_PAGE = 5;

function formatRelationType(type) {
  if (!type) return 'Inconnue';
  return String(type);
}

function getRelationTargetName(relation = {}) {
  return (
    relation.targetNameSnapshot ||
    relation.targetProfileNameSnapshot ||
    `Utilisateur ${relation.targetUserId || 'inconnu'}${relation.targetSlot ? ` • Slot ${relation.targetSlot}` : ''}`
  );
}

function getRelationPage(relations = [], page = 1) {
  const safeRelations = Array.isArray(relations) ? relations : [];
  const totalPages = Math.max(1, Math.ceil(safeRelations.length / RELATIONS_PER_PAGE));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

  const start = (currentPage - 1) * RELATIONS_PER_PAGE;
  const items = safeRelations.slice(start, start + RELATIONS_PER_PAGE);

  return {
    page: currentPage,
    totalPages,
    totalItems: safeRelations.length,
    items,
  };
}

function buildRelationListEmbed(profile, ownerUser, guild, page = 1) {
  const pageData = getRelationPage(profile?.relations || [], page);
  const { items, totalItems, totalPages } = pageData;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`📇 Relations — ${ownerUser.username}`)
    .setDescription(
      items.length > 0
        ? items
            .map((relation, index) => {
              const absoluteIndex = (pageData.page - 1) * RELATIONS_PER_PAGE + index + 1;

              return [
                `**${absoluteIndex}. ${getRelationTargetName(relation)}**`,
                `Type : ${formatRelationType(relation.type)}`,
                relation.description ? `Description : ${relation.description}` : null,
              ]
                .filter(Boolean)
                .join('\n');
            })
            .join('\n\n')
        : 'Aucune relation enregistrée.'
    )
    .setFooter({
      text: `${guild?.name || 'Serveur'} • ${totalItems}/${MAX_RELATIONS_PER_PROFILE} relations • Page ${pageData.page}/${totalPages}`,
    })
    .setTimestamp();

  return embed;
}

function buildRelationDetailEmbed(profile, ownerUser, relation, guild) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🔍 Relation — ${ownerUser.username}`)
    .addFields(
      {
        name: 'Cible',
        value: getRelationTargetName(relation),
        inline: true,
      },
      {
        name: 'Type',
        value: formatRelationType(relation.type),
        inline: true,
      },
      {
        name: 'Description',
        value: relation.description || 'Aucune description',
        inline: false,
      }
    )
    .setFooter({
      text: guild?.name || 'Serveur',
    })
    .setTimestamp();
}

module.exports = {
  MAX_RELATIONS_PER_PROFILE,
  RELATIONS_PER_PAGE,
  formatRelationType,
  getRelationTargetName,
  getRelationPage,
  buildRelationListEmbed,
  buildRelationDetailEmbed,
};