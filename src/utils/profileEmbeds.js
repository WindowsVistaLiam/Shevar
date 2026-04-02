const { EmbedBuilder } = require('discord.js');

const MAX_RELATIONS_PER_PROFILE = 50;
const RELATIONS_PER_PAGE = 5;

function truncate(text, maxLength = 100) {
  if (!text) return 'Non renseigné';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function formatRelationType(type = '') {
  const value = String(type || '').trim();
  if (!value) return 'Non précisé';

  return value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getRelationTargetName(relation = {}) {
  if (relation.targetNameSnapshot?.trim()) {
    return relation.targetNameSnapshot.trim();
  }

  if (relation.targetUserId) {
    return `Utilisateur ${relation.targetUserId}${relation.targetSlot ? ` • Slot ${relation.targetSlot}` : ''}`;
  }

  return 'Cible inconnue';
}

function formatDate(date) {
  if (!date) return 'Inconnue';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Inconnue';
  return parsed.toLocaleString('fr-FR');
}

function getRelationPage(relations = [], page = 1) {
  const totalItems = Array.isArray(relations) ? relations.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / RELATIONS_PER_PAGE));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * RELATIONS_PER_PAGE;
  const items = relations.slice(start, start + RELATIONS_PER_PAGE);

  return {
    page: safePage,
    totalPages,
    totalItems,
    items,
  };
}

function buildRelationListEmbed(profile, user, guild, page = 1) {
  const relations = Array.isArray(profile.relations) ? profile.relations : [];
  const pageData = getRelationPage(relations, page);

  const description =
    pageData.items.length > 0
      ? pageData.items
          .map((relation, index) => {
            const absoluteIndex = (pageData.page - 1) * RELATIONS_PER_PAGE + index + 1;
            const targetName = getRelationTargetName(relation);
            const type = formatRelationType(relation.type);
            const desc = relation.description?.trim()
              ? truncate(relation.description.trim(), 120)
              : 'Aucune description';

            return `**${absoluteIndex}.** ${type} — **${targetName}**\n*${desc}*`;
          })
          .join('\n\n')
      : '*Aucune relation enregistrée pour ce profil.*';

  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`💞 Relations de ${profile.nomPrenom || user.username}`)
    .setDescription(description)
    .addFields(
      {
        name: '📊 Résumé',
        value: [
          `**Total :** ${relations.length}/${MAX_RELATIONS_PER_PROFILE}`,
          `**Page :** ${pageData.page}/${pageData.totalPages}`,
        ].join('\n'),
        inline: false,
      }
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • Slot ${profile.slot || 1}`,
    })
    .setTimestamp();
}

function buildRelationDetailEmbed(profile, user, relation, guild) {
  return new EmbedBuilder()
    .setColor(0xd35400)
    .setTitle(`🔎 Détail d’une relation — ${profile.nomPrenom || user.username}`)
    .addFields(
      {
        name: '🎯 Cible',
        value: getRelationTargetName(relation),
        inline: false,
      },
      {
        name: '🏷️ Type',
        value: formatRelationType(relation.type),
        inline: false,
      },
      {
        name: '📝 Description',
        value: relation.description?.trim() || 'Aucune description',
        inline: false,
      },
      {
        name: '🗂️ Métadonnées',
        value: `**Créée le :** ${formatDate(relation.createdAt)}`,
        inline: false,
      }
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • Slot ${profile.slot || 1}`,
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