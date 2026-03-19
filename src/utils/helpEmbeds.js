const { EmbedBuilder } = require('discord.js');

function buildHelpEmbed(page = 1, guildName = 'Serveur RP') {
  if (page === 1) {
    return new EmbedBuilder()
      .setColor(0x8e44ad)
      .setTitle('📘 Aide — Commandes générales')
      .setDescription('Bienvenue dans le panneau d’aide du bot RP.')
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
          name: '🧭 Navigation',
          value: 'Les profils et la boutique utilisent des boutons et menus pour naviguer entre les pages, slots et catégories.',
          inline: false
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 1/3` })
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
          name: '🤝 Échanges',
          value: [
            '`/donner-argent` — proposer un échange d’argent',
            '`/donner-objet` — proposer un échange d’objet'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎒 Informations utiles',
          value: 'Le portefeuille et l’inventaire se trouvent dans la page 3 du profil actif.',
          inline: false
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 2/3` })
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setColor(0x2c3e50)
    .setTitle('🛠️ Aide — Administration')
    .addFields(
      {
        name: '👑 Profils',
        value: [
          '`/supprimer-profil` — supprimer le profil d’un joueur'
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
    .setFooter({ text: `${guildName} • Aide • Page 3/3` })
    .setTimestamp();
}

module.exports = {
  buildHelpEmbed
};