const { EmbedBuilder } = require('discord.js');

const RUMORS_PER_PAGE = 6;
const MAX_RUMOR_LENGTH = 500;
const RUMOR_CHANNEL_ID = '1490838515578179685';

function truncate(text, maxLength) {
  if (!text) return 'Aucun contenu.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function getRumorPage(rumors = [], page = 1) {
  const totalPages = Math.max(1, Math.ceil(rumors.length / RUMORS_PER_PAGE));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * RUMORS_PER_PAGE;

  return {
    page: safePage,
    totalPages,
    totalItems: rumors.length,
    items: rumors.slice(start, start + RUMORS_PER_PAGE)
  };
}

function buildRumorListEmbed({ rumors, page, mode, guild, profileName, slot }) {
  const pageData = getRumorPage(rumors, page);

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`🕯️ Panneau des rumeurs — ${profileName || 'Profil inconnu'} • Slot ${slot}`)
    .setDescription(
      pageData.totalItems === 0
        ? mode === 'mine'
          ? 'Tu n’as encore publié aucune rumeur avec ce profil.'
          : 'Aucune rumeur active sur ce serveur.'
        : pageData.items
            .map((rumor, index) => {
              const absoluteIndex = (pageData.page - 1) * RUMORS_PER_PAGE + index + 1;
              const author = rumor.anonymous
                ? 'Anonyme'
                : (rumor.authorProfileNameSnapshot || 'Profil inconnu');

              const target =
                rumor.targetProfileNameSnapshot
                  ? `\n🎯 **Cible :** ${rumor.targetProfileNameSnapshot}`
                  : '';

              return [
                `**#${absoluteIndex} — ${author}**`,
                `${truncate(rumor.content, 140)}${target}`,
                `👍 ${rumor.believers?.length || 0} • 👎 ${rumor.deniers?.length || 0}`
              ].join('\n');
            })
            .join('\n\n')
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • Vue : ${mode === 'mine' ? 'Mes rumeurs' : 'Toutes les rumeurs'} • Salon public : ${RUMOR_CHANNEL_ID} • Page ${pageData.page}/${pageData.totalPages}`
    })
    .setTimestamp();
}

function buildRumorDetailEmbed(rumor, guild) {
  const author = rumor.anonymous
    ? 'Anonyme'
    : (rumor.authorProfileNameSnapshot || 'Profil inconnu');

  const target = rumor.targetProfileNameSnapshot || 'Aucune cible précise';

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('📜 Détail de la rumeur')
    .addFields(
      {
        name: 'Auteur affiché',
        value: author,
        inline: false
      },
      {
        name: 'Cible',
        value: target,
        inline: false
      },
      {
        name: 'Statut',
        value: rumor.status || 'active',
        inline: false
      },
      {
        name: 'Contenu',
        value: rumor.content || 'Aucun contenu.',
        inline: false
      },
      {
        name: 'Réactions',
        value: `👍 ${rumor.believers?.length || 0} • 👎 ${rumor.deniers?.length || 0}`,
        inline: false
      }
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • ${new Date(rumor.createdAt || Date.now()).toLocaleString('fr-FR')}`
    })
    .setTimestamp();
}

function buildPublishedRumorEmbed(rumor) {
  const author = rumor.anonymous
    ? '🎭 Source inconnue'
    : `🪪 ${rumor.authorProfileNameSnapshot || 'Profil inconnu'}`;

  const target = rumor.targetProfileNameSnapshot
    ? `\n🎯 **Cible :** ${rumor.targetProfileNameSnapshot}`
    : '';

  return new EmbedBuilder()
    .setColor(rumor.anonymous ? 0x43474d : 0x5865f2)
    .setTitle('🕯️ Une rumeur circule...')
    .setDescription(`${rumor.content}${target}`)
    .addFields(
      {
        name: 'Origine',
        value: author,
        inline: false
      },
      {
        name: 'Réactions',
        value: `👍 ${rumor.believers?.length || 0} • 👎 ${rumor.deniers?.length || 0}`,
        inline: false
      }
    )
    .setFooter({
      text: `Rumeur RP • ${new Date(rumor.createdAt || Date.now()).toLocaleString('fr-FR')}`
    })
    .setTimestamp();
}

module.exports = {
  RUMORS_PER_PAGE,
  MAX_RUMOR_LENGTH,
  RUMOR_CHANNEL_ID,
  getRumorPage,
  buildRumorListEmbed,
  buildRumorDetailEmbed,
  buildPublishedRumorEmbed
};