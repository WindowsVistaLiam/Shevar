const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  MessageFlags
} = require('discord.js');

const Letter = require('../models/Letter');
const Profile = require('../models/Profile');
const { getActiveSlot } = require('../services/profileService');

const LETTERS_PER_PAGE = 5;
const RECIPIENTS_PER_PAGE = 25;

function truncate(text, max = 80) {
  if (!text) return 'Sans objet';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function formatDate(date) {
  if (!date) return 'Inconnue';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Inconnue';
  return d.toLocaleString('fr-FR');
}

function paginate(items, page = 1, perPage = LETTERS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * perPage;

  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + perPage)
  };
}

function hasInterceptionItem(profile) {
  const inventory = Array.isArray(profile?.inventory) ? profile.inventory : [];
  const equippedItems = profile?.equippedItems || {};

  const names = [
    ...inventory.map(item => String(item.name || '').toLowerCase()),
    ...Object.values(equippedItems).map(item => String(item?.itemNameSnapshot || '').toLowerCase())
  ];

  const keywords = [
    'lunette',
    'jumelle',
    'masque espion',
    'sceau d\'écoute',
    'artefact d\'écoute',
    'relique d\'interception',
    'oreille de verre'
  ];

  return names.some(name => keywords.some(keyword => name.includes(keyword)));
}

function buildMainMenuEmbed(guildName) {
  return new EmbedBuilder()
    .setColor(0xe0b84d)
    .setTitle('✉️ Système de Lettres')
    .setDescription([
      'Choisis une action :',
      '',
      '📝 **Rédiger** une lettre',
      '📬 **Boîte** de réception',
      '📦 **Archives**',
      '🗑️ **Corbeille**',
      '🕵️ **Intercepter** une lettre dans ta zone'
    ].join('\n'))
    .setFooter({
      text: `${guildName || 'Serveur RP'} • Lettres`
    })
    .setTimestamp();
}

function buildMainMenuRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`letter:menu_write:${userId}`)
      .setLabel('Rédiger')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`letter:menu_inbox:${userId}`)
      .setLabel('Boîte')
      .setEmoji('📬')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`letter:menu_archive:${userId}`)
      .setLabel('Archives')
      .setEmoji('📦')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`letter:menu_trash:${userId}`)
      .setLabel('Corbeille')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`letter:menu_intercept:${userId}`)
      .setLabel('Intercepter')
      .setEmoji('🕵️')
      .setStyle(ButtonStyle.Success)
  );
}

function buildMailboxEmbed({ title, letters, page, totalPages }) {
  return new EmbedBuilder()
    .setColor(0xe0b84d)
    .setTitle(title)
    .setDescription(
      letters.length
        ? letters.map((letter, index) => {
            const sender = letter.isAnonymous ? 'Anonyme' : (letter.senderNameSnapshot || letter.senderId);
            const subject = truncate(letter.subject || 'Sans objet', 60);
            return `**${index + 1}.** ${subject}\nDe : **${sender}** • ${formatDate(letter.createdAt)}`;
          }).join('\n\n')
        : 'Aucune lettre.'
    )
    .setFooter({
      text: `Page ${page}/${totalPages}`
    })
    .setTimestamp();
}

function buildMailboxPayload({ title, letters, page, totalPages, ownerUserId, mode }) {
  const embed = buildMailboxEmbed({ title, letters, page, totalPages });

  const rows = [];

  const listButtons = letters.map((letter, index) =>
    new ButtonBuilder()
      .setCustomId(`letter:read:${ownerUserId}:${mode}:${letter._id}`)
      .setLabel(String(index + 1))
      .setStyle(ButtonStyle.Secondary)
  );

  if (listButtons.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(listButtons));
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`letter:list_prev:${ownerUserId}:${mode}:${page}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),

      new ButtonBuilder()
        .setCustomId(`letter:list_next:${ownerUserId}:${mode}:${page}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages),

      new ButtonBuilder()
        .setCustomId(`letter:back_menu:${ownerUserId}`)
        .setLabel('Menu')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return {
    embeds: [embed],
    components: rows
  };
}

function buildLetterEmbed(letter, viewerId, intercepted = false) {
  const sender = letter.isAnonymous ? 'Anonyme' : (letter.senderNameSnapshot || letter.senderId);
  const receiver = letter.receiverNameSnapshot || letter.receiverId;

  const embed = new EmbedBuilder()
    .setColor(intercepted ? 0x8e44ad : 0xe0b84d)
    .setTitle(`✉️ ${letter.subject || 'Sans objet'}`)
    .setDescription(letter.content || 'Lettre vide')
    .addFields(
      {
        name: 'Expéditeur',
        value: sender,
        inline: true
      },
      {
        name: 'Destinataire',
        value: receiver,
        inline: true
      },
      {
        name: 'Envoyée le',
        value: formatDate(letter.createdAt),
        inline: false
      }
    )
    .setFooter({
      text: intercepted ? 'Lettre interceptée' : 'Lecture de lettre'
    })
    .setTimestamp();

  const row = new ActionRowBuilder();

  if (!intercepted) {
    if (letter.status === 'sent') {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`letter:archive_one:${viewerId}:${letter._id}`)
          .setLabel('Archiver')
          .setEmoji('📦')
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`letter:delete_one:${viewerId}:${letter._id}`)
          .setLabel('Détruire')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`letter:return_list:${viewerId}:inbox`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Primary)
      );
    } else if (letter.status === 'archived') {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`letter:delete_one:${viewerId}:${letter._id}`)
          .setLabel('Détruire')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`letter:return_list:${viewerId}:archive`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Primary)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`letter:return_list:${viewerId}:trash`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Primary)
      );
    }
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`letter:back_menu:${viewerId}`)
        .setLabel('Menu')
        .setStyle(ButtonStyle.Primary)
    );
  }

  return {
    embeds: [embed],
    components: [row]
  };
}

async function getMailboxLetters(guildId, userId, mode) {
  if (mode === 'inbox') {
    return Letter.find({
      guildId,
      receiverId: userId,
      status: 'sent'
    }).sort({ createdAt: -1 });
  }

  if (mode === 'archive') {
    return Letter.find({
      guildId,
      receiverId: userId,
      status: 'archived'
    }).sort({ createdAt: -1 });
  }

  return Letter.find({
    guildId,
    receiverId: userId,
    status: 'deleted'
  }).sort({ createdAt: -1 });
}

async function buildMailboxPage(guildId, userId, mode, page = 1) {
  const letters = await getMailboxLetters(guildId, userId, mode);
  const paginated = paginate(letters, page);

  const title =
    mode === 'inbox'
      ? '📬 Boîte de réception'
      : mode === 'archive'
        ? '📦 Archives'
        : '🗑️ Corbeille';

  return buildMailboxPayload({
    title,
    letters: paginated.items,
    page: paginated.page,
    totalPages: paginated.totalPages,
    ownerUserId: userId,
    mode
  });
}

function buildRecipientPage(users, ownerId, page = 1) {
  const paginated = paginate(users, page, RECIPIENTS_PER_PAGE);

  const embed = new EmbedBuilder()
    .setColor(0xe0b84d)
    .setTitle('📮 Choix du destinataire')
    .setDescription('Choisis le joueur qui recevra la lettre.')
    .setFooter({
      text: `Page ${paginated.page}/${paginated.totalPages}`
    });

  const options = paginated.items.map(user => ({
    label: truncate(user.displayName || user.username || user.id, 90),
    value: user.id,
    description: `ID : ${user.id}`.slice(0, 100)
  }));

  const rows = [];

  if (options.length > 0) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`letter:recipient_select:${ownerId}:${paginated.page}`)
          .setPlaceholder('Choisir un destinataire')
          .addOptions(options)
      )
    );
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`letter:recipient_prev:${ownerId}:${paginated.page}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(paginated.page <= 1),

      new ButtonBuilder()
        .setCustomId(`letter:recipient_next:${ownerId}:${paginated.page}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(paginated.page >= paginated.totalPages),

      new ButtonBuilder()
        .setCustomId(`letter:back_menu:${ownerId}`)
        .setLabel('Menu')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return {
    embeds: [embed],
    components: rows
  };
}

async function sendLetterNotification(client, letter) {
  try {
    const user = await client.users.fetch(letter.receiverId);
    if (!user) return;

    const sender = letter.isAnonymous ? 'Anonyme' : (letter.senderNameSnapshot || letter.senderId);

    const embed = new EmbedBuilder()
      .setColor(0xe0b84d)
      .setTitle('📬 Nouvelle lettre reçue')
      .setDescription([
        `**De :** ${sender}`,
        `**Objet :** ${letter.subject || 'Sans objet'}`,
        '',
        'Utilise `/lettre` pour la consulter.'
      ].join('\n'))
      .setTimestamp();

    await user.send({ embeds: [embed] }).catch(() => {});
  } catch {
    // ignore DM failures
  }
}

module.exports = function registerLetterInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isButton() && interaction.customId.startsWith('letter:')) {
        const parts = interaction.customId.split(':');
        const action = parts[1];

        if (action === 'menu_write') {
          const ownerId = parts[2];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const members = await interaction.guild.members.fetch();
          const users = members
            .filter(member => !member.user.bot && member.id !== interaction.user.id)
            .map(member => ({
              id: member.id,
              username: member.user.username,
              displayName: member.displayName
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));

          if (users.length === 0) {
            await interaction.reply({
              content: 'Aucun destinataire disponible.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            ...buildRecipientPage(users, interaction.user.id, 1)
          });
          return;
        }

        if (action === 'recipient_prev' || action === 'recipient_next') {
          const ownerId = parts[2];
          const currentPage = Number(parts[3]) || 1;

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const members = await interaction.guild.members.fetch();
          const users = members
            .filter(member => !member.user.bot && member.id !== interaction.user.id)
            .map(member => ({
              id: member.id,
              username: member.user.username,
              displayName: member.displayName
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));

          const nextPage = action === 'recipient_prev' ? currentPage - 1 : currentPage + 1;

          await interaction.update(buildRecipientPage(users, interaction.user.id, nextPage));
          return;
        }

        if (action === 'menu_inbox' || action === 'menu_archive' || action === 'menu_trash') {
          const ownerId = parts[2];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const mode =
            action === 'menu_inbox' ? 'inbox' :
            action === 'menu_archive' ? 'archive' :
            'trash';

          const payload = await buildMailboxPage(interaction.guildId, interaction.user.id, mode, 1);
          await interaction.update(payload);
          return;
        }

        if (action === 'menu_intercept') {
          const ownerId = parts[2];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

          const profile = await Profile.findOne({
            guildId: interaction.guildId,
            userId: interaction.user.id,
            slot
          });

          if (!profile || !profile.location || profile.location === 'Aucune') {
            await interaction.editReply({
              content: "Tu n'as pas de position définie."
            });
            return;
          }

          const candidateLetters = await Letter.find({
            guildId: interaction.guildId,
            location: profile.location,
            receiverId: { $ne: interaction.user.id },
            senderId: { $ne: interaction.user.id },
            status: { $in: ['sent', 'archived'] }
          }).sort({ createdAt: -1 });

          if (candidateLetters.length === 0) {
            await interaction.editReply({
              content: `Aucune lettre à intercepter depuis **${profile.location}**.`
            });
            return;
          }

          const baseChance = 0.25;
          const bonusChance = hasInterceptionItem(profile) ? 0.20 : 0;
          const success = Math.random() < (baseChance + bonusChance);

          if (!success) {
            await interaction.editReply({
              content: hasInterceptionItem(profile)
                ? "❌ Échec de l'interception malgré ton équipement."
                : "❌ Tu n'as intercepté aucune lettre."
            });
            return;
          }

          const availableLetters = candidateLetters.filter(
            letter => !letter.interceptedBy.includes(interaction.user.id)
          );

          const pool = availableLetters.length > 0 ? availableLetters : candidateLetters;
          const selectedLetter = pool[Math.floor(Math.random() * pool.length)];

          if (!selectedLetter.interceptedBy.includes(interaction.user.id)) {
            selectedLetter.interceptedBy.push(interaction.user.id);
            selectedLetter.interceptedCount = (selectedLetter.interceptedCount || 0) + 1;
            await selectedLetter.save();
          }

          await interaction.editReply({
            content: `🕵️ Interception réussie depuis **${profile.location}**.`,
            ...buildLetterEmbed(selectedLetter, interaction.user.id, true)
          });
          return;
        }

        if (action === 'list_prev' || action === 'list_next') {
          const ownerId = parts[2];
          const mode = parts[3];
          const currentPage = Number(parts[4]) || 1;

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const nextPage = action === 'list_prev' ? currentPage - 1 : currentPage + 1;
          const payload = await buildMailboxPage(interaction.guildId, interaction.user.id, mode, nextPage);
          await interaction.update(payload);
          return;
        }

        if (action === 'read') {
          const ownerId = parts[2];
          const mode = parts[3];
          const letterId = parts[4];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const letter = await Letter.findOne({
            _id: letterId,
            guildId: interaction.guildId,
            receiverId: interaction.user.id
          });

          if (!letter) {
            await interaction.reply({
              content: 'Lettre introuvable.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          await interaction.update(buildLetterEmbed(letter, interaction.user.id, false));
          return;
        }

        if (action === 'archive_one') {
          const ownerId = parts[2];
          const letterId = parts[3];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const letter = await Letter.findOne({
            _id: letterId,
            guildId: interaction.guildId,
            receiverId: interaction.user.id
          });

          if (!letter) {
            await interaction.reply({
              content: 'Lettre introuvable.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          letter.status = 'archived';
          await letter.save();

          const payload = await buildMailboxPage(interaction.guildId, interaction.user.id, 'archive', 1);
          await interaction.update(payload);
          return;
        }

        if (action === 'delete_one') {
          const ownerId = parts[2];
          const letterId = parts[3];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const letter = await Letter.findOne({
            _id: letterId,
            guildId: interaction.guildId,
            receiverId: interaction.user.id
          });

          if (!letter) {
            await interaction.reply({
              content: 'Lettre introuvable.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          letter.status = 'deleted';
          await letter.save();

          const payload = await buildMailboxPage(interaction.guildId, interaction.user.id, 'trash', 1);
          await interaction.update(payload);
          return;
        }

        if (action === 'return_list') {
          const ownerId = parts[2];
          const mode = parts[3];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const payload = await buildMailboxPage(interaction.guildId, interaction.user.id, mode, 1);
          await interaction.update(payload);
          return;
        }

        if (action === 'back_menu') {
          const ownerId = parts[2];

          if (interaction.user.id !== ownerId) {
            await interaction.reply({
              content: "Ce menu ne t'appartient pas.",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          await interaction.update({
            embeds: [buildMainMenuEmbed(interaction.guild?.name)],
            components: [buildMainMenuRow(interaction.user.id)]
          });
          return;
        }
      }

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('letter:recipient_select:')) {
        const parts = interaction.customId.split(':');
        const ownerId = parts[2];

        if (interaction.user.id !== ownerId) {
          await interaction.reply({
            content: "Ce menu ne t'appartient pas.",
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const receiverId = interaction.values[0];

        const modal = new ModalBuilder()
          .setCustomId(`letter_modal:${interaction.user.id}:${receiverId}`)
          .setTitle('Rédiger une lettre');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('subject')
              .setLabel('Objet')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setMaxLength(120)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('anonymous')
              .setLabel('Anonyme ? (oui/non)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setMaxLength(3)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('content')
              .setLabel('Contenu')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(4000)
          )
        );

        await interaction.showModal(modal);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('letter_modal:')) {
        const parts = interaction.customId.split(':');
        const ownerId = parts[1];
        const receiverId = parts[2];

        if (interaction.user.id !== ownerId) {
          await interaction.reply({
            content: "Ce formulaire ne t'appartient pas.",
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const subject = interaction.fields.getTextInputValue('subject').trim();
        const anonymousInput = interaction.fields.getTextInputValue('anonymous').trim().toLowerCase();
        const content = interaction.fields.getTextInputValue('content').trim();

        const isAnonymous = ['oui', 'yes', 'y', 'o'].includes(anonymousInput);

        const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: interaction.user.id,
          slot
        });

        const receiverProfile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: receiverId
        }).sort({ updatedAt: -1 });

        const letter = new Letter({
          guildId: interaction.guildId,
          senderId: interaction.user.id,
          receiverId,
          senderNameSnapshot: profile?.nomPrenom || interaction.user.username,
          receiverNameSnapshot: receiverProfile?.nomPrenom || receiverId,
          subject,
          content,
          location: profile?.location || 'Aucune',
          isAnonymous
        });

        await letter.save();
        await sendLetterNotification(client, letter);

        await interaction.reply({
          content: [
            '✉️ Lettre envoyée.',
            `Destinataire : **${letter.receiverNameSnapshot}**`,
            `Lieu d’envoi : **${letter.location}**`,
            `Mode : **${isAnonymous ? 'Anonyme' : 'Signée'}**`
          ].join('\n'),
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      console.error('❌ Lettre error:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue dans le système de lettres.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue dans le système de lettres.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};