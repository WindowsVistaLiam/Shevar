const { EmbedBuilder } = require('discord.js');

function buildHelpEmbed(page = 1, guildName = 'Serveur RP') {
  // PAGE 1 — PROFILS & CONSULTATION
  if (page === 1) {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📘 Aide — Profils & Consultation')
      .setDescription('Toutes les commandes liées à la création, la gestion et la consultation des profils RP.')
      .addFields(
        {
          name: '👤 Gestion du profil',
          value: [
            '`/profil` — modifier ton profil actif',
            '`/profil-creer` — créer un personnage',
            '`/profil-switch` — changer de slot actif',
            '`/profil-supprimer` — supprimer ton profil actif',
            '`/lister-profils` — lister les profils d’un joueur',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🔎 Consultation',
          value: [
            '`/voir-profil` — voir le profil d’un joueur',
            '`/metier` — modifier le métier du profil actif',
            '`/titre` — voir ses titres',
            '`/equiper-titre` — équiper un titre',
          ].join('\n'),
          inline: false,
        },
        {
          name: '💞 Social',
          value: [
            '`/relation` — gérer tes relations RP',
            '`/rumeur` — gérer les rumeurs',
            '`/relation` compte aussi dans le classement des relations',
          ].join('\n'),
          inline: false,
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 1/3` })
      .setTimestamp();
  }

  // PAGE 2 — CORRUPTION & PERSONNALISATION
  if (page === 2) {
    return new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('☣️ Aide — Corruption & Personnalisation')
      .setDescription('Tout ce qui concerne la corruption, l’apparence du profil et les options premium.')
      .addFields(
        {
          name: '☣️ Corruption',
          value: [
            'La corruption évolue selon tes messages RP dans les salons configurés',
            'Elle modifie l’état affiché sur ton profil',
            '`/repos` — réduire ta corruption',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🖼️ Images du profil',
          value: [
            '`/profil` — modifie l’image principale du profil',
            'L’image principale apparaît sur la page 1',
            'Une image dédiée peut aussi être affichée sur la page 2',
          ].join('\n'),
          inline: false,
        },
        {
          name: '✨ Avantage booster',
          value: [
            '`/image-page2` — définir ton image personnalisée de page 2',
            '`/image-page2-reset` — réinitialiser l’image de page 2',
            'Ces commandes sont réservées au rôle booster',
          ].join('\n'),
          inline: false,
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 2/3` })
      .setTimestamp();
  }

  // PAGE 3 — OUTILS, RP & ADMIN
  return new EmbedBuilder()
    .setColor(0x2c3e50)
    .setTitle('🛠️ Aide — Outils, RP & Administration')
    .setDescription('Commandes générales du serveur et commandes réservées au staff.')
    .addFields(
      {
        name: '🎲 Outils RP',
        value: [
          '`/roll` — lancer des dés',
          '`/classement` — voir les classements',
          '`/map` — voir la map / les positions selon le système du serveur',
          '`/lettre` — utiliser le système de lettres',
          '`/help` — afficher cette aide',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🧑‍⚖️ Commandes admin / MJ',
        value: [
          '`/supprimer-profil` — supprimer un profil',
          '`/ajouter-souillure` — ajouter de la corruption',
          '`/heal` — retirer de la corruption',
          '`/ajouter-titre` — ajouter un titre',
          '`/retirer-titre` — retirer un titre',
          '`/admin-reputation` — gérer la réputation',
          '`/admin-reputation-historique` — voir l’historique de réputation',
          '`/admin-rumeur` — gérer les rumeurs',
          '`/message` — envoyer un message staff / système',
        ].join('\n'),
        inline: false,
      },
      {
        name: '📝 Remarques',
        value: [
          'Le profil se consulte désormais sur **2 pages**',
          'Le système de progression RP a été retiré',
          'Le système boutique / échanges / inventaire visuel n’est plus utilisé',
        ].join('\n'),
        inline: false,
      }
    )
    .setFooter({ text: `${guildName} • Aide • Page 3/3` })
    .setTimestamp();
}

module.exports = { buildHelpEmbed };