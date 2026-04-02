const { EmbedBuilder } = require('discord.js');

const MAX_RELATIONS_PER_PROFILE = 25;
const RELATIONS_PER_PAGE = 5;

function formatRelationType(type) {
  if (!type) return 'Inconnue';
  return String(type);
}

function getRelationTargetName(relation) {
  return relation.targetNameSnapshot || 'Inconnu';
}

function getRelationPage(relations = [], page = 1) {
  const totalPages = Math.max(1, Math.ceil(relations.length / RELATIONS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const start = (currentPage - 1) * RELATIONS_PER_PAGE;
  const items = relations.slice(start, start + RELATIONS_PER_PAGE);

  return {
    page: currentPage,
    totalPages,
    items,
  };
}

function buildRelationListEmbed(profile, ownerUser, guild, pageData) {
  const { page, totalPages, items } = pageData;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`📇 Relations — ${ownerUser.username}`)
    .setDescription(
      items.length
        ? items
            .map((relation, index) => {
              return [
                `**${index + 1}. ${getRelationTargetName(relation)}**`,
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
      text: `${guild?.name || 'Serveur'} • Page ${page}/${totalPages}`,
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