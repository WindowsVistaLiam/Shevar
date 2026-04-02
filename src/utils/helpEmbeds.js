const { EmbedBuilder } = require('discord.js');

function buildSection(lines = []) {
  return lines.join('\n');
}

function buildHelpEmbed(page = 1, guildName = 'Serveur RP') {
  if (page === 1) {
    return new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('✦ Manuel du voyageur — Profils')
      .setDescription(
        'Voici les commandes principales pour créer, consulter et organiser tes personnages.'
      )
      .addFields(
        {
          name: '╭─ Création & gestion',
          value: buildSection([
            '`/profil-creer` — créer un personnage',
            '`/profil` — modifier le profil actif',
            '`/profil-switch` — changer de slot actif',
            '`/profil-supprimer` — supprimer ton profil actif',
            '`/lister-profils` — voir les profils d’un joueur',
          ]),
          inline: false,
        },
        {
          name: '╭─ Consultation',
          value: buildSection([
            '`/voir-profil` — consulter un profil',
            '`/metier` — définir le métier',
            '`/titre` — consulter ses titres',
            '`/equiper-titre` — équiper un titre',
          ]),
          inline: false,
        },
        {
          name: '╭─ Liens & interactions',
          value: buildSection([
            '`/relation` — gérer les relations RP',
            '`/rumeur` — consulter / gérer les rumeurs',
          ]),
          inline: false,
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 1/3` })
      .setTimestamp();
  }

  if (page === 2) {
    return new EmbedBuilder()
      .setColor(0x9333ea)
      .setTitle('✦ Manuel du voyageur — Corruption')
      .setDescription(
        'Cette section regroupe tout ce qui touche à la corruption et à la personnalisation visuelle du profil.'
      )
      .addFields(
        {
          name: '╭─ Corruption',
          value: buildSection([
            'La corruption évolue selon les salons RP configurés.',
            'Elle influence l’état affiché sur le profil.',
            '`/repos` — réduire sa corruption',
          ]),
          inline: false,
        },
        {
          name: '╭─ Apparence du profil',
          value: buildSection([
            '`/profil` — modifier l’image principale',
            'La page 1 affiche l’image principale du personnage.',
            'La page 2 peut afficher une image différente.',
          ]),
          inline: false,
        },
        {
          name: '╭─ Avantages booster',
          value: buildSection([
            '`/image-page2` — définir l’image de la page 2',
            '`/image-page2-reset` — réinitialiser l’image de la page 2',
            'Réservé au rôle booster.',
          ]),
          inline: false,
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 2/3` })
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setColor(0x0f172a)
    .setTitle('✦ Manuel du voyageur — Outils & Staff')
    .setDescription(
      'Les commandes générales du serveur ainsi que les commandes réservées au staff.'
    )
    .addFields(
      {
        name: '╭─ Outils RP',
        value: buildSection([
          '`/roll` — lancer des dés',
          '`/classement` — consulter les classements',
          '`/map` — afficher la carte',
          '`/lettre` — utiliser le système de lettres',
          '`/help` — afficher cette aide',
        ]),
        inline: false,
      },
      {
        name: '╭─ Administration / MJ',
        value: buildSection([
          '`/supprimer-profil` — supprimer un profil',
          '`/ajouter-souillure` — ajouter de la corruption',
          '`/heal` — réduire / retirer de la corruption',
          '`/ajouter-titre` — ajouter un titre',
          '`/retirer-titre` — retirer un titre',
          '`/admin-reputation` — gérer la réputation',
          '`/admin-reputation-historique` — voir l’historique de réputation',
          '`/admin-rumeur` — gérer les rumeurs',
          '`/message` — envoyer un message staff / système',
        ]),
        inline: false,
      },
      {
        name: '╭─ Notes',
        value: buildSection([
          'Le profil se consulte sur **2 pages**.',
          'Le système de progression RP n’est plus utilisé.',
          'Le système boutique / échange n’est plus utilisé.',
        ]),
        inline: false,
      }
    )
    .setFooter({ text: `${guildName} • Aide • Page 3/3` })
    .setTimestamp();
}

module.exports = { buildHelpEmbed };