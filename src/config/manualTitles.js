const MANUAL_TITLES = [
  {
    name: 'Citadin',
    rarity: 'common',
    description: "RP dans tous les districts de Shevar’.",
  },
  {
    name: 'Globe-Trotter',
    rarity: 'common',
    description: 'RP sur tous les continents de la planète.',
  },
  {
    name: 'Space !',
    rarity: 'rare',
    description: 'Faire un tour en haute orbite.',
  },
  {
    name: 'Le rêve de Zalax',
    rarity: 'rare',
    description: 'Visiter une autre planète.',
  },
  {
    name: 'Ground 0',
    rarity: 'epic',
    description: 'Aller sur le monde 786.',
  },
  {
    name: 'S̶O̴N̶ ̴T̸R̶Ô̷N̵E̵',
    rarity: 'legendary',
    description: 'Aller à l’origine de la Fracture.',
  },
  {
    name: 'Le caca de toute la ville',
    rarity: 'common',
    description: "Visiter les égouts de Shevar’. Mais qu'est-ce que vous faites là bas ?!",
  },
  {
    name: 'Sécuriser la frontière',
    rarity: 'rare',
    description: 'Éliminer un Rauthéen.',
  },
  {
    name: 'Ambitieux',
    rarity: 'epic',
    description: 'Engager le combat contre un PNJ (ou PJ) censé être plus fort.',
  },
  {
    name: 'In the face of God',
    rarity: 'legendary',
    description: 'Vaincre un Alkinès en combat singulier.',
  },
  {
    name: 'Dragonslayer',
    rarity: 'legendary',
    description: 'Vaincre un Qweël en combat singulier.',
  },
  {
    name: 'Strange Aeons..',
    rarity: 'legendary',
    description: 'Éliminer un Alkinès de la Mort.',
  },
  {
    name: 'Finir le travail',
    rarity: 'legendary',
    description: 'Tuer Reginn.',
  },
  {
    name: 'Glorieux combat',
    rarity: 'epic',
    description: "Vivre pour l'aura farm, mourir dans l'aura farm.",
  },
  {
    name: "L’union fait la force",
    rarity: 'legendary',
    description: 'Entrer en synergie.',
  },
  {
    name: 'La Haine et le Sexe',
    rarity: 'epic',
    description: 'Effectuer un « fade to black » avec votre pire ennemi.',
  },
  {
    name: 'Entremetteur',
    rarity: 'common',
    description: 'Provoquer ou faciliter une romance entre deux PJs/PNJs.',
  },
  {
    name: 'Arc Rédemption',
    rarity: 'common',
    description: 'Aider quelqu’un à revenir sur le droit chemin.',
  },
  {
    name: 'Première étape',
    rarity: 'common',
    description: 'Donner à quelqu’un de bonnes raisons de vous détester.',
  },
  {
    name: 'Moi et tous mes CO-PAINS',
    rarity: 'rare',
    description: 'Devenir ami (ou créer un lien de confiance) avec 6 PJs/PNJs.',
  },
  {
    name: 'Formation premium',
    rarity: 'common',
    description: 'Devenir l’élève d’un PJ/PNJ.',
  },
  {
    name: 'Nouvelle génération',
    rarity: 'common',
    description: 'Enseigner à un PJ/PNJ.',
  },
  {
    name: 'Factory reset',
    rarity: 'legendary',
    description: '(Re)Débloquer l’Éclat.',
  },
  {
    name: 'Ghost in the machine',
    rarity: 'legendary',
    description: 'Effacer TOUTE trace de son existence.',
  },
  {
    name: 'The Big Leagues',
    rarity: 'epic',
    description: 'Devenir chef d’une faction déjà existante en rp.',
  },
  {
    name: 'Mais c’était sûr en fait !',
    rarity: 'rare',
    description: 'Émettre une théorie qui se révèle vraie par la suite.',
  },
  {
    name: 'Ascension',
    rarity: 'legendary',
    description: 'Devenir un Alkinès.',
  },
  {
    name: 'Noclip no problem',
    rarity: 'epic',
    description: 'Sortir de la zone définie comme la « Barrière ».',
  },
  {
    name: 'Uh-oh…',
    rarity: 'rare',
    description: 'Attirer l’attention de la Forêt.',
  },
  {
    name: 'All’s well that ends in red',
    rarity: 'rare',
    description: 'Servir Sa’raoth.',
  },
];

function normalizeTitleName(name = '') {
  return String(name)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getManualTitleByName(name = '') {
  const normalized = normalizeTitleName(name);

  return (
    MANUAL_TITLES.find(title => normalizeTitleName(title.name) === normalized) || null
  );
}

module.exports = {
  MANUAL_TITLES,
  normalizeTitleName,
  getManualTitleByName,
};