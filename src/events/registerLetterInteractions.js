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

/* ================= UTIL ================= */

function truncate(text, max = 80) {
  if (!text) return 'Sans objet';
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function formatDate(date) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? 'Inconnue' : d.toLocaleString('fr-FR');
}

function paginate(items, page = 1, perPage = LETTERS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.max(1, Math.min(totalPages, page));
  const start = (safePage - 1) * perPage;

  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + perPage)
  };
}

function hasInterceptionItem(profile) {
  const inventory = profile?.inventory || [];
  return inventory.some(i =>
    ['lunette', 'jumelle', 'espion'].some(k =>
      i.name?.toLowerCase().includes(k)
    )
  );
}

/* ================= EMBEDS ================= */

function buildLetterEmbed(letter, userId, intercepted = false) {
  const embed = new EmbedBuilder()
    .setColor(intercepted ? 0x8e44ad : 0xe0b84d)
    .setTitle(`✉️ ${letter.subject || 'Sans objet'}`)
    .setDescription(letter.content)
    .addFields(
      {
        name: 'Expéditeur',
        value: letter.isAnonymous ? 'Anonyme' : letter.senderNameSnapshot,
        inline: true
      },
      {
        name: 'Date',
        value: formatDate(letter.createdAt),
        inline: true
      }
    );

  const row = new ActionRowBuilder();

  if (!intercepted) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`letter:reply:${userId}:${letter._id}`)
        .setLabel('Répondre')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`letter:delete:${userId}:${letter._id}`)
        .setLabel('Supprimer')
        .setStyle(ButtonStyle.Danger)
    );
  }

  return { embeds: [embed], components: [row] };
}

/* ================= MAIN ================= */

module.exports = function registerLetterInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {

      /* ================= BUTTON ================= */

      if (interaction.isButton() && interaction.customId.startsWith('letter:')) {
        const [_, action, userId, data] = interaction.customId.split(':');

        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: "Pas ton interaction.",
            flags: MessageFlags.Ephemeral
          });
        }

        /* ===== RÉDIGER ===== */

        if (action === 'menu_write') {
          const members = await interaction.guild.members.fetch();

          const options = members
            .filter(m => !m.user.bot && m.id !== interaction.user.id)
            .first(25)
            .map(m => ({
              label: m.displayName,
              value: m.id
            }));

          const select = new StringSelectMenuBuilder()
            .setCustomId(`letter:select:${interaction.user.id}`)
            .setPlaceholder('Choisir un destinataire')
            .addOptions(options);

          return interaction.reply({
            components: [new ActionRowBuilder().addComponents(select)],
            flags: MessageFlags.Ephemeral
          });
        }

        /* ===== LECTURE ===== */

        if (action === 'read') {
          const letter = await Letter.findById(data);

          return interaction.update(
            buildLetterEmbed(letter, interaction.user.id)
          );
        }

        /* ===== SUPPRESSION ===== */

        if (action === 'delete') {
          await Letter.findByIdAndDelete(data);

          return interaction.update({
            content: "Lettre supprimée.",
            components: []
          });
        }

        /* ===== RÉPONDRE ===== */

        if (action === 'reply') {
          const modal = new ModalBuilder()
            .setCustomId(`letter_reply:${interaction.user.id}:${data}`)
            .setTitle('Répondre');

          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Message')
                .setStyle(TextInputStyle.Paragraph)
            )
          );

          return interaction.showModal(modal); // ✅ FIX CRITIQUE
        }

        /* ===== INTERCEPTION ===== */

        if (action === 'menu_intercept') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

          const profile = await Profile.findOne({
            guildId: interaction.guildId,
            userId: interaction.user.id,
            slot
          });

          const letters = await Letter.find({
            guildId: interaction.guildId,
            location: profile.location
          });

          if (!letters.length) {
            return interaction.editReply("Aucune lettre.");
          }

          const chance = hasInterceptionItem(profile) ? 0.45 : 0.25;

          if (Math.random() > chance) {
            return interaction.editReply("❌ Échec.");
          }

          const letter = letters[Math.floor(Math.random() * letters.length)];

          return interaction.editReply(
            buildLetterEmbed(letter, interaction.user.id, true)
          );
        }
      }

      /* ================= SELECT ================= */

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('letter:select')) {
        const receiverId = interaction.values[0];

        const modal = new ModalBuilder()
          .setCustomId(`letter_modal:${interaction.user.id}:${receiverId}`)
          .setTitle('Nouvelle lettre');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('subject')
              .setLabel('Objet')
              .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('content')
              .setLabel('Message')
              .setStyle(TextInputStyle.Paragraph)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('anon')
              .setLabel('Anonyme (oui/non)')
              .setStyle(TextInputStyle.Short)
          )
        );

        return interaction.showModal(modal); // ✅ FIX CRBOT
      }

      /* ================= MODAL ================= */

      if (interaction.isModalSubmit()) {

        /* ===== ENVOI ===== */

        if (interaction.customId.startsWith('letter_modal')) {
          const [_, userId, receiverId] = interaction.customId.split(':');

          const subject = interaction.fields.getTextInputValue('subject');
          const content = interaction.fields.getTextInputValue('content');
          const anon = interaction.fields.getTextInputValue('anon');

          const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

          const profile = await Profile.findOne({
            guildId: interaction.guildId,
            userId: interaction.user.id,
            slot
          });

          const letter = new Letter({
            guildId: interaction.guildId,
            senderId: interaction.user.id,
            receiverId,
            senderNameSnapshot: profile.nomPrenom,
            subject,
            content,
            location: profile.location,
            isAnonymous: anon === 'oui'
          });

          await letter.save();

          // DM
          try {
            const user = await client.users.fetch(receiverId);
            await user.send(`📬 Nouvelle lettre : ${subject || 'Sans objet'}`);
          } catch {}

          return interaction.reply({
            content: "Lettre envoyée.",
            flags: MessageFlags.Ephemeral
          });
        }

        /* ===== RÉPONSE ===== */

        if (interaction.customId.startsWith('letter_reply')) {
          const [_, userId, originalId] = interaction.customId.split(':');

          const original = await Letter.findById(originalId);

          const content = interaction.fields.getTextInputValue('content');

          const reply = new Letter({
            guildId: interaction.guildId,
            senderId: interaction.user.id,
            receiverId: original.senderId,
            subject: `RE: ${original.subject}`,
            content,
            location: original.location
          });

          await reply.save();

          return interaction.reply({
            content: "Réponse envoyée.",
            flags: MessageFlags.Ephemeral
          });
        }
      }

    } catch (err) {
      console.error('❌ Lettre error:', err);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Erreur système.",
          flags: MessageFlags.Ephemeral
        });
      }
    }
  });
};