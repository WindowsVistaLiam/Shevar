const { EmbedBuilder } = require('discord.js');

function block(lines = []) {
  return lines.join('\n');
}

function buildHelpEmbed(page = 1, guildName = 'Serveur RP') {
  if (page === 1) {
    return new EmbedBuilder()
      .setColor(0x00b0f4)
      .setTitle('📱 Centre d’aide — Profils & Identités')
      .setDescription(
        'Bienvenue dans l’interface d’assistance du serveur.\n' +
        'Retrouve ici tout ce qu’il faut pour créer, gérer et consulter tes personnages.'
      )
      .addFields(
        {
          name: '🧾 Création & gestion du profil',
          value: block([
            '`/profil-creer` — créer un nouveau personnage',
            '`/profil` — modifier le profil actif',
            '`/profil-switch` — changer de slot actif',
            '`/profil-supprimer` — supprimer le profil actif',
            '`/lister-profils` — afficher les profils d’un joueur',
          ]),
          inline: false,
        },
        {
          name: '👁️ Consultation & identité',
          value: block([
            '`/voir-profil` — consulter la fiche d’un personnage',
            '`/metier` — modifier le métier du profil actif',
            '`/titre` — consulter ses titres',
            '`/equiper-titre` — équiper un titre',
          ]),
          inline: false,
        },
        {
          name: '🫂 Liens sociaux & rumeurs',
          value: block([
            '`/relation` — gérer les relations RP',
            '`/rumeur` — consulter ou gérer les rumeurs',
            'Les relations sont aussi prises en compte dans le classement.',
          ]),
          inline: false,
        }
      )
      .setFooter({ text: `${guildName} • Centre d’aide • Écran 1/3` })
      .setTimestamp();
  }

  if (page === 2) {
    return new EmbedBuilder()
      .setColor(0xa855f7)
      .setTitle('🧬 Centre d’aide — Corruption & Personnalisation')
      .setDescription(
        'Cette section regroupe tout ce qui influence l’état du personnage et son affichage visuel.'
      )
      .addFields(
        {
          name: '☣️ Corruption',
          value: block([
            'La corruption évolue selon ton activité RP dans les salons configurés.',
            'Elle modifie l’état affiché sur ton profil.',
            '`/repos` — réduire la corruption du personnage',
          ]),
          inline: false,
        },
        {
          name: '🖼️ Apparence du profil',
          value: block([
            '`/profil` — modifier l’image principale du personnage',
            'La page 1 affiche l’image principale',
            'La page 2 peut afficher une image différente',
          ]),
          inline: false,
        },
        {
          name: '💎 Option booster',
          value: block([
            '`/image-page2` — définir une image dédiée à la page 2',
            '`/image-page2-reset` — réinitialiser cette image',
            'Fonction réservée au rôle booster',
          ]),
          inline: false,
        }
      )
      .setFooter({ text: `${guildName} • Centre d’aide • Écran 2/3` })
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setColor(0x111827)
    .setTitle('🛠️ Centre d’aide — Outils & Administration')
    .setDescription(
      'Retrouve ici les commandes pratiques du serveur ainsi que les outils réservés au staff.'
    )
    .addFields(
      {
        name: '🎲 Outils RP',
        value: block([
          '`/roll` — lancer des dés',
          '`/classement` — afficher les classements',
          '`/map` — consulter la carte',
          '`/help` — afficher cette aide',
        ]),
        inline: false,
      },
      {
        name: '🧑‍💼 Commandes staff / MJ',
        value: block([
          '`/supprimer-profil` — supprimer un profil',
          '`/ajouter-souillure` — ajouter de la corruption',
          '`/heal` — réduire / retirer la corruption',
          '`/ajouter-titre` — ajouter un titre',
          '`/retirer-titre` — retirer un titre',
          '`/admin-reputation` — gérer la réputation',
          '`/admin-reputation-historique` — consulter l’historique',
          '`/admin-rumeur` — gérer les rumeurs',
          '`/message` — envoyer un message système / staff',
        ]),
        inline: false,
      },
      {
        name: '📌 Infos utiles',
        value: block([
          'Le profil se consulte sur **2 pages**.',
          'Le système de progression RP n’est plus utilisé.',
          'Le système boutique / échange / inventaire visuel n’est plus utilisé.',
        ]),
        inline: false,
      }
    )
    .setFooter({ text: `${guildName} • Centre d’aide • Écran 3/3` })
    .setTimestamp();
}

module.exports = { buildHelpEmbed };