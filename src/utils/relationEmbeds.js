const { EmbedBuilder } = require('discord.js');

const RELATIONS_PER_PAGE = 5;
const MAX_RELATIONS_PER_PROFILE = 20;
const ALLOWED_RELATION_TYPES = ['allie', 'rival', 'famille', 'mentor', 'disciple', 'amour', 'haine', 'neutre', 'autre'];

function truncate(text, maxLength) {
  if (!text) return 'Non renseigné';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function formatRelationType(type = 'autre') {
  const labels = {
    allie: 'Allié',
    rival: 'Rival',
    famille: 'Famille',
    mentor: 'Mentor',
    disciple: 'Disciple',
    amour: 'Amour',
    haine: 'Haine',
    neutre: 'Neutre',
    autre: 'Autre'
  };

  return labels[type] || 'Autre';
}

function sortRelations(relations = []) {
  return [...relations].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
    totalItems: sorted.length
  };
}

function buildRelationListEmbed(profile, ownerUser, guild, page = 1) {
  const { items, totalPages, totalItems, page: safePage } = getRelationPage(profile.relations || [], page);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: `Relations de ${ownerUser.username}`,
      iconURL: ownerUser.displayAvatarURL({ size: 256 })
    })
    .setTitle(`${profile.nomPrenom || 'Personnage sans nom'} • Slot ${profile.slot}`)
    .setDescription(
      totalItems === 0
        ? 'Aucune relation RP enregistrée pour ce profil.'
        : items
            .map((relation, index) => {
              const absoluteIndex = (safePage - 1) * RELATIONS_PER_PAGE + index + 1;
              const targetName =
                relation.targetProfileNameSnapshot ||
                `Utilisateur ${relation.targetUserId} • Slot ${relation.targetSlot || 1}`;

              const description = relation.description
                ? `\n${truncate(relation.description, 120)}`
                : '';

              return `**${absoluteIndex}. ${formatRelationType(relation.type)}** — ${truncate(targetName, 70)}${description}`;
            })
            .join('\n\n')
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • ${totalItems}/${MAX_RELATIONS_PER_PROFILE} relations • Page ${safePage}/${totalPages}`
    })
    .setTimestamp();

  return embed;
}

function buildRelationDetailEmbed(profile, ownerUser, relation, guild) {
  const targetName =
    relation.targetProfileNameSnapshot ||
    `Utilisateur ${relation.targetUserId} • Slot ${relation.targetSlot || 1}`;

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: `Relation détaillée de ${ownerUser.username}`,
      iconURL: ownerUser.displayAvatarURL({ size: 256 })
    })
    .setTitle(`${profile.nomPrenom || 'Personnage sans nom'} • Slot ${profile.slot}`)
    .addFields(
      {
        name: 'Type',
        value: formatRelationType(relation.type),
        inline: false
      },
      {
        name: 'Profil ciblé',
        value: targetName,
        inline: false
      },
      {
        name: 'Référence',
        value: `Utilisateur : \`${relation.targetUserId}\`\nSlot : \`${relation.targetSlot}\``,
        inline: false
      },
      {
        name: 'Description',
        value: relation.description || 'Aucune description.',
        inline: false
      }
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • Relation créée le ${new Date(relation.createdAt || Date.now()).toLocaleString('fr-FR')}`
    })
    .setTimestamp();
}

module.exports = {
  RELATIONS_PER_PAGE,
  MAX_RELATIONS_PER_PROFILE,
  ALLOWED_RELATION_TYPES,
  formatRelationType,
  getRelationPage,
  buildRelationListEmbed,
  buildRelationDetailEmbed
};