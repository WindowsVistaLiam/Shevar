const { EmbedBuilder } = require('discord.js');

function buildHelpEmbed(page = 1, guildName = 'Serveur RP') {
  if (page === 1) {
    return new EmbedBuilder()
      .setColor(0x8e44ad)
      .setTitle('📘 Aide — Profils & Personnages')
      .setDescription('Commandes liées aux profils RP et à leur gestion.')
      .addFields(
        {
          name: '👤 Profils',
          value: [
            '`/profil` — modifier le profil actif',
            '`/profil-creer` — créer un profil dans un slot précis',
            '`/profil-switch` — changer de profil actif',
            '`/profil-supprimer` — supprimer l’un de tes profils',
            '`/voir-profil` — consulter un profil',
            '`/lister-profils` — lister les profils d’un joueur',
            '`/metier` — modifier le métier du profil actif'
          ].join('\n'),
          inline: false
        },
        {
          name: '🩸 Souillure',
          value: [
            '`/repos` — réduire de 10% la souillure de ton profil actif'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 1/4` })
      .setTimestamp();
  }

  if (page === 2) {
    return new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle('💰 Aide — Économie & Boutique')
      .addFields(
        {
          name: '🛒 Boutique',
          value: [
            '`/boutique` — ouvrir la boutique',
            '`/acheter` — acheter un article',
            '`/vendre` — vendre un article'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎒 Infos utiles',
          value: 'Le portefeuille et l’inventaire sont visibles dans la page 3 du profil.',
          inline: false
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 2/4` })
      .setTimestamp();
  }

  if (page === 3) {
    return new EmbedBuilder()
      .setColor(0x16a085)
      .setTitle('🤝 Aide — Échanges & Interactions')
      .addFields(
        {
          name: '🤲 Dons',
          value: [
            '`/donner-argent` — proposer un don d’argent',
            '`/donner-objet` — proposer un don d’objet'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔄 Échanges',
          value: [
            '`/echange` — ouvrir un panneau d’échange avec un autre joueur',
            '`/historique-echanges` — voir les 10 derniers échanges'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎲 RP',
          value: [
            '`/roll` — lancer un ou plusieurs dés'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 3/4` })
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setColor(0x2c3e50)
    .setTitle('🛠️ Aide — Administration & MJ')
    .addFields(
      {
        name: '👑 Profils',
        value: [
          '`/supprimer-profil` — supprimer le profil d’un joueur'
        ].join('\n'),
        inline: false
      },
      {
        name: '🩸 Souillure',
        value: [
          '`/heal` — retirer de la souillure à un joueur',
          '`/ajouter-souillure` — ajouter de la souillure à un joueur'
        ].join('\n'),
        inline: false
      },
      {
        name: '💰 Économie',
        value: [
          '`/set-portefeuille`',
          '`/ajouter-argent`',
          '`/retirer-argent`',
          '`/ajouter-objet`',
          '`/retirer-objet`'
        ].join('\n'),
        inline: false
      },
      {
        name: '🏪 Boutique',
        value: [
          '`/set-boutique-item`',
          '`/supprimer-boutique-item`',
          '`/lister-boutique-items`'
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({ text: `${guildName} • Aide • Page 4/4` })
    .setTimestamp();
}

module.exports = {
  buildHelpEmbed
};