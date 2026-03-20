const { EmbedBuilder } = require('discord.js');

const SOUILLURE_STAGES = [
  {
    max: 10,
    label: 'Aucune anomalie perceptible.',
    gifUrl: 'https://media.tenor.com/your-gif-1.gif'
  },
  {
    max: 20,
    label: 'Altération comportementale.',
    gifUrl: 'https://media.tenor.com/your-gif-2.gif'
  },
  {
    max: 30,
    label: 'Altération comportementale brutale.',
    gifUrl: 'https://media.tenor.com/your-gif-3.gif'
  },
  {
    max: 40,
    label: 'Altération comportementale brutale et trace de striure sur le corps.',
    gifUrl: 'https://media.tenor.com/your-gif-4.gif'
  },
  {
    max: 50,
    label: 'Altération comportementale brutale et une partie du corps altérée.',
    gifUrl: 'https://media.tenor.com/your-gif-5.gif'
  },
  {
    max: 60,
    label: 'Altération comportementale brutale et plusieurs parties du corps altérées.',
    gifUrl: 'https://media.tenor.com/your-gif-6.gif'
  },
  {
    max: 70,
    label: 'Perte de lucidité et de la maîtrise de ses actes, altérations profondes sur le corps.',
    gifUrl: 'https://media.tenor.com/your-gif-7.gif'
  },
  {
    max: 80,
    label: 'Perte totale de lucidité et séquelles sur le corps.',
    gifUrl: 'https://media.tenor.com/your-gif-8.gif'
  },
  {
    max: 90,
    label: 'Phase de non retour amorcée.',
    gifUrl: 'https://media.tenor.com/your-gif-9.gif'
  },
  {
    max: 100,
    label: "La réalité elle-même semble se déformer, ce personnage n'est plus que l'ombre de lui-même.",
    gifUrl: 'https://media.tenor.com/your-gif-10.gif'
  }
];

function getSouillureStageIndex(value = 0) {
  const souillure = Math.max(0, Math.min(100, Number(value) || 0));

  return SOUILLURE_STAGES.findIndex(stage => souillure <= stage.max);
}

function getSouillureStage(value = 0) {
  const index = getSouillureStageIndex(value);
  return SOUILLURE_STAGES[index] || SOUILLURE_STAGES[SOUILLURE_STAGES.length - 1];
}

function buildSouillureStageEmbed({ profile, user, souillure }) {
  const stage = getSouillureStage(souillure);

  return new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle('🩸 La Souillure évolue')

    .setDescription(
      `**${profile.nomPrenom || user.username}** franchit un nouveau seuil...\n\n` +
      `**État :** ${stage.label}\n` +
      `**Souillure :** ${souillure}%`
    )

    // Avatar Discord
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))

    // Image principale : GIF du palier OU image du perso
    .setImage(profile.image || stage.gifUrl)

    .setFooter({
      text: `Slot ${profile.slot} • ${user.username}`
    })

    .setTimestamp();
}

module.exports = {
  SOUILLURE_STAGES,
  getSouillureStageIndex,
  getSouillureStage,
  buildSouillureStageEmbed
};