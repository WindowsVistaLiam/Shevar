const { EmbedBuilder } = require('discord.js');
const { getTitleRarityDisplay } = require('./titleUtils');

function truncate(text, maxLength) {
  if (!text) return 'Non renseigné';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function buildCorruptionBar(value = 0) {
  const corruption = Math.max(0, Math.min(100, Number(value) || 0));
  const filled = Math.round(corruption / 10);
  const empty = 10 - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${corruption}%`;
}

function getCorruptionState(souillure = 0) {
  if (souillure <= 10) return 'Aucune anomalie perceptible.';
  if (souillure <= 20) return 'Altération comportementale.';
  if (souillure <= 30) return 'Altération comportementale brutale.';
  if (souillure <= 40) return 'Altération comportementale brutale et trace de striure sur le corps.';
  if (souillure <= 50) return 'Altération comportementale brutale et une partie du corps altérée.';
  if (souillure <= 60) return 'Altération comportementale brutale et plusieurs parties du corps altérées.';
  if (souillure <= 70) return 'Perte de lucidité et de la maîtrise de ses actes, altérations profondes sur le corps.';
  if (souillure <= 80) return 'Perte totale de lucidité et séquelles sur le corps.';
  if (souillure < 100) return 'Phase de non retour amorcée.';
  return "La réalité elle-même semble se déformer, ce personnage n'est plus que l'ombre de lui-même.";
}

function getPresenceText(souillure = 0) {
  if (souillure <= 20) return 'Présence stable.';
  if (souillure <= 40) return 'Présence troublante.';
  if (souillure <= 60) return 'Présence inquiétante.';
  if (souillure <= 80) return 'Présence oppressante.';
  return 'Présence anormale et presque insoutenable.';
}

function getEquippedTitleDisplay(profile) {
  if (!profile.equippedTitle) return 'Aucun titre équipé';
  if (!Array.isArray(profile.titles) || profile.titles.length === 0) return profile.equippedTitle;

  const equipped = profile.titles.find(title => {
    if (typeof title === 'string') return title === profile.equippedTitle;
    return title.name === profile.equippedTitle;
  });

  if (!equipped) return profile.equippedTitle;
  if (typeof equipped === 'string') return getTitleRarityDisplay(equipped, 'common');

  return getTitleRarityDisplay(equipped.name, equipped.rarity || 'common');
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
    autre: 'Autre',
  };

  return labels[type] || 'Autre';
}

function buildRelationsSummary(relations = []) {
  if (!Array.isArray(relations) || relations.length === 0) {
    return 'Aucune relation connue.';
  }

  const sorted = [...relations].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const preview = sorted.slice(0, 4).map(relation => {
    const targetName =
      relation.targetNameSnapshot ||
      relation.targetProfileNameSnapshot ||
      `Utilisateur ${relation.targetUserId || 'inconnu'}${relation.targetSlot ? ` • Slot ${relation.targetSlot}` : ''}`;

    return `• **${formatRelationType(relation.type)}** — ${truncate(targetName, 60)}`;
  });

  const remaining = sorted.length - preview.length;
  if (remaining > 0) {
    preview.push(`• … et **${remaining}** autre(s)`);
  }

  return truncate(preview.join('\n'), 1024);
}

function buildReputationSummary(profile) {
  const positive = Number(profile.positiveReputation) || 0;
  const negative = Number(profile.negativeReputation) || 0;
  const balance = positive - negative;
  const balanceText = balance > 0 ? `+${balance}` : `${balance}`;

  return [
    `🌟 **Réputation positive :** ${positive}`,
    `🕸️ **Réputation négative :** ${negative}`,
    `⚖️ **Balance :** ${balanceText}`,
  ].join('\n');
}

function formatDate(date) {
  if (!date) return 'Inconnue';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Inconnue';
  return parsed.toLocaleString('fr-FR');
}

function getPageColor(page, souillure = 0) {
  if (page === 1) return 0x3498db;
  if (page === 2) return 0x9b59b6;

  if (souillure <= 20) return 0x95a5a6;
  if (souillure <= 40) return 0x8e44ad;
  if (souillure <= 60) return 0x7d3c98;
  if (souillure <= 80) return 0xc0392b;
  return 0x7f0000;
}

function buildProfileEmbed(profile, targetUser, guild, page = 1) {
  const souillure = Number(profile.souillure) || 0;
  const color = getPageColor(page, souillure);
  const slot = profile.slot || 1;

  const baseFooter = {
    text: `${guild?.name || 'Serveur RP'} • Profil de ${targetUser.username} • Slot ${slot} • Page ${page}/2`,
  };

  if (page === 1) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: `📘 Dossier de ${targetUser.username}`,
        iconURL: targetUser.displayAvatarURL({ size: 256 }),
      })
      .setTitle(`✨ ${profile.nomPrenom || 'Personnage sans nom'} • Slot ${slot}`)
      .addFields(
        { name: '🪪 Identité', value: profile.nomPrenom || 'Non renseigné', inline: false },
        { name: '👤 Âge / Genre', value: profile.ageGenre || 'Non renseigné', inline: false },
        { name: '🔮 Pouvoir / Aptitude', value: truncate(profile.pouvoir || 'Non renseigné', 1024), inline: false },
        { name: '📝 Description', value: truncate(profile.description || 'Aucune description.', 1024), inline: false },
        { name: '⭐ Réputation', value: buildReputationSummary(profile), inline: false },
        { name: '💞 Relations', value: buildRelationsSummary(profile.relations || []), inline: false }
      )
      .setFooter(baseFooter)
      .setTimestamp();

    if (profile.imageUrl) {
      embed.setThumbnail(profile.imageUrl);
      embed.setImage(profile.imageUrl);
    }

    return embed;
  }

  const page2Image = profile.imageUrlPage2 || profile.imageUrl || '';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `📚 Détails complémentaires de ${targetUser.username}`,
      iconURL: targetUser.displayAvatarURL({ size: 256 }),
    })
    .setTitle(`🧾 Fiche annexe — ${profile.nomPrenom || targetUser.username} • Slot ${slot}`)
    .addFields(
      { name: '💼 Métier', value: profile.metier || 'Sans métier', inline: false },
      { name: '🏅 Titre équipé', value: getEquippedTitleDisplay(profile), inline: false },
      { name: '☣️ Corruption', value: `${buildCorruptionBar(souillure)}\n${getCorruptionState(souillure)}`, inline: false },
      { name: '👁️ Présence', value: getPresenceText(souillure), inline: false },
      {
        name: '📂 Archive',
        value: [
          `**Créé le :** ${formatDate(profile.createdAt)}`,
          `**Dernière mise à jour :** ${formatDate(profile.updatedAt)}`,
        ].join('\n'),
        inline: false,
      }
    )
    .setFooter(baseFooter)
    .setTimestamp();

  if (page2Image) {
    embed.setThumbnail(page2Image);
    embed.setImage(page2Image);
  }

  return embed;
}

module.exports = {
  buildProfileEmbed,
};