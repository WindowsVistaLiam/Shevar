const { EmbedBuilder } = require('discord.js');

const MAX_RELATIONS_PER_PROFILE = 20;
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

  if (relation.targetProfileNameSnapshot?.trim()) {
    return relation.targetProfileNameSnapshot.trim();
  }

  if (relation.targetUserId) {
    return `Utilisateur ${relation.targetUserId}${relation.targetSlot ? ` • Slot ${relation.targetSlot}` : ''}`;
  }

  return 'Cible inconnue';
}

function sortRelations(relations = []) {
  return [...relations].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

function getRelationPage(relations = [], page = 1) {
  const sorted = sortRelations(relations);
  const totalPages = Math.max(1, Math.ceil(sorted.length / RELATIONS_PER_PAGE));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * RELATIONS_PER_PAGE;

  return {
    totalPages,
    page: safePage,
    items: sorted.slice(start, start + RELATIONS_PER_PAGE),
    totalItems: sorted.length,
  };
}

function formatDate(date) {
  if (!date) return 'Inconnue';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Inconnue';
  return parsed.toLocaleString('fr-FR');
}

function buildRelationListEmbed(profile, ownerUser, guild, page = 1) {
  const { items, totalPages, totalItems, page: safePage } = getRelationPage(
    profile.relations || [],
    page
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: `Relations de ${ownerUser.username}`,
      iconURL: ownerUser.displayAvatarURL({ size: 256 }),
    })
    .setTitle(`${profile.nomPrenom || 'Personnage sans nom'} • Slot ${profile.slot}`)
    .setDescription(
      totalItems === 0
        ? 'Aucune relation RP enregistrée pour ce profil.'
        : items
            .map((relation, index) => {
              const absoluteIndex = (safePage - 1) * RELATIONS_PER_PAGE + index + 1;
              const targetName = getRelationTargetName(relation);
              const description = relation.description
                ? `\n${truncate(relation.description, 120)}`
                : '';

              return `**${absoluteIndex}. ${formatRelationType(relation.type)}** — ${truncate(targetName, 70)}${description}`;
            })
            .join('\n\n')
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • ${totalItems}/${MAX_RELATIONS_PER_PROFILE} relations • Page ${safePage}/${totalPages}`,
    })
    .setTimestamp();

  return embed;
}

function buildRelationDetailEmbed(profile, ownerUser, relation, guild) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: `Relation détaillée de ${ownerUser.username}`,
      iconURL: ownerUser.displayAvatarURL({ size: 256 }),
    })
    .setTitle(`${profile.nomPrenom || 'Personnage sans nom'} • Slot ${profile.slot}`)
    .addFields(
      {
        name: 'Type',
        value: formatRelationType(relation.type),
        inline: false,
      },
      {
        name: 'Cible',
        value: getRelationTargetName(relation),
        inline: false,
      },
      {
        name: 'Description',
        value: relation.description || 'Aucune description.',
        inline: false,
      },
      {
        name: 'Créée le',
        value: formatDate(relation.createdAt),
        inline: false,
      }
    )
    .setFooter({
      text: guild?.name || 'Serveur RP',
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