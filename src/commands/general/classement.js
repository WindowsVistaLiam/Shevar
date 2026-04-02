const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const Profile = require('../../models/Profile');
const {
  getLabel,
  getModeLabel,
  formatValue,
  buildRanking,
  getPersonalRank,
  paginateRanking,
  getNextType,
  getPreviousType,
} = require('../../utils/classementUtils');
const { createClassementAttachment } = require('../../utils/classementCanvas');
const { getActiveSlot } = require('../../services/profileService');

function buildButtons(ownerUserId, page, totalPages, type, mode) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`classement:page_prev:${ownerUserId}:${page}:${type}:${mode}`)
        .setLabel('⬅️ Page')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`classement:page_next:${ownerUserId}:${page}:${type}:${mode}`)
        .setLabel('Page ➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages),
      new ButtonBuilder()
        .setCustomId(`classement:toggle_mode:${ownerUserId}:${page}:${type}:${mode}`)
        .setLabel(`Mode: ${mode}`)
        .setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`classement:type_prev:${ownerUserId}:${page}:${type}:${mode}`)
        .setLabel('⬅️ Type')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`classement:type_next:${ownerUserId}:${page}:${type}:${mode}`)
        .setLabel('Type ➡️')
        .setStyle(ButtonStyle.Success)
    ),
  ];
}

async function buildUsersMap(client, entries) {
  const uniqueUserIds = [...new Set(entries.map(entry => entry.userId))];
  const map = new Map();

  await Promise.all(
    uniqueUserIds.map(async userId => {
      try {
        const user = await client.users.fetch(userId);
        map.set(userId, user);
      } catch {
        map.set(userId, null);
      }
    })
  );

  return map;
}

async function buildClassementPayload({
  client,
  guild,
  guildId,
  viewerId,
  viewerSlot,
  type,
  mode,
  page,
}) {
  const profiles = await Profile.find({ guildId }).lean();
  const ranking = buildRanking(profiles, type, mode);
  const paginated = paginateRanking(ranking, page, 10);

  const itemsWithRank = paginated.items.map((entry, index) => ({
    ...entry,
    rank: (paginated.page - 1) * paginated.perPage + index + 1,
  }));

  const usersMap = await buildUsersMap(client, itemsWithRank);
  const attachment = await createClassementAttachment({
    paginatedItems: itemsWithRank,
    usersMap,
  });

  const lines = itemsWithRank.map(entry => {
    const prefix = entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `**${entry.rank}.**`;
    const name =
      mode === 'joueur'
        ? `<@${entry.userId}>`
        : `${entry.displayName} *(slot ${entry.slot})*`;

    return `${prefix} ${name} — **${formatValue(type, entry.value)}**`;
  });

  const personalRank = getPersonalRank(ranking, viewerId, viewerSlot, mode);
  const personalEntry = personalRank > 0 ? ranking[personalRank - 1] : null;

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🏆 Classement — ${getLabel(type)}`)
    .setDescription(
      [
        `**Mode :** ${getModeLabel(mode)}`,
        `**Page :** ${paginated.page}/${paginated.totalPages}`,
        personalRank > 0
          ? `**Ton classement :** #${personalRank} — **${formatValue(type, personalEntry.value)}**`
          : '**Ton classement :** non classé',
        '',
        lines.length > 0 ? lines.join('\n') : '*Aucune entrée pour le moment.*',
      ].join('\n')
    )
    .setImage('attachment://classement-podium.png')
    .setFooter({ text: `${guild.name} • ${paginated.totalItems} entrée(s)` })
    .setTimestamp();

  return {
    embeds: [embed],
    files: [attachment],
    components: buildButtons(
      viewerId,
      paginated.page,
      paginated.totalPages,
      type,
      mode
    ),
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Voir les classements du serveur')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type de classement')
        .setRequired(false)
        .addChoices(
          { name: 'Titres', value: 'titles' },
          { name: 'Réputation positive', value: 'reputation_positive' },
          { name: 'Réputation négative', value: 'reputation_negative' },
          { name: 'Relations', value: 'relations' },
          { name: 'Messages RP', value: 'rp_messages' },
          { name: 'XP', value: 'xp' },
          { name: 'Niveau RP', value: 'rp_level' }
        )
    )
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('Par profil ou par joueur')
        .setRequired(false)
        .addChoices(
          { name: 'Par profil', value: 'profil' },
          { name: 'Par joueur', value: 'joueur' }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type') || 'xp';
    const mode = interaction.options.getString('mode') || 'profil';
    const viewerSlot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const payload = await buildClassementPayload({
      client: interaction.client,
      guild: interaction.guild,
      guildId: interaction.guildId,
      viewerId: interaction.user.id,
      viewerSlot,
      type,
      mode,
      page: 1,
    });

    await interaction.reply(payload);
  },

  buildClassementPayload,
};