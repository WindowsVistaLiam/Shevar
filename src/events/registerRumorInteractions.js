const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const Profile = require('../models/Profile');
const Rumor = require('../models/rumor');
const { buildRumorListEmbed, buildRumorDetailEmbed, getRumorPage, MAX_RUMOR_LENGTH } = require('../utils/rumorEmbeds');
const { buildRumorRows } = require('../utils/rumorComponents');

async function getRumorsForMode(guildId, ownerUserId, slot, mode) {
  const query = {
    guildId,
    status: 'active'
  };

  if (mode === 'mine') {
    query.authorUserId = ownerUserId;
    query.authorSlot = slot;
  }

  return Rumor.find(query).sort({ createdAt: -1 }).lean();
}

async function buildRumorPanel(guildId, guild, ownerUserId, slot, mode, page) {
  const profile = await Profile.findOne({
    guildId,
    userId: ownerUserId,
    slot
  }).lean();

  if (!profile) {
    return null;
  }

  const rumors = await getRumorsForMode(guildId, ownerUserId, slot, mode);
  const pageData = getRumorPage(rumors, page);

  return {
    embeds: [
      buildRumorListEmbed({
        rumors,
        page: pageData.page,
        mode,
        guild,
        profileName: profile.nomPrenom,
        slot
      })
    ],
    components: buildRumorRows(
      ownerUserId,
      slot,
      mode,
      pageData.page,
      pageData.totalPages,
      pageData.items
    )
  };
}

module.exports = function registerRumorInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isButton()) {
        if (
          !interaction.customId.startsWith('rumor_prev:') &&
          !interaction.customId.startsWith('rumor_next:') &&
          !interaction.customId.startsWith('rumor_toggle:') &&
          !interaction.customId.startsWith('rumor_publish_anon:') &&
          !interaction.customId.startsWith('rumor_publish_named:')
        ) {
          return;
        }

        const [action, ownerUserId, rawSlot, mode, rawPage] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        let page = Number(rawPage) || 1;

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            ephemeral: true
          });
          return;
        }

        if (action === 'rumor_publish_anon' || action === 'rumor_publish_named') {
          const publishMode = action === 'rumor_publish_named' ? 'named' : 'anon';

          const modal = new ModalBuilder()
            .setCustomId(`rumor_publish_modal:${ownerUserId}:${slot}:${publishMode}:${mode}:${page}`)
            .setTitle('Publier une rumeur');

          const contentInput = new TextInputBuilder()
            .setCustomId('content')
            .setLabel('Contenu de la rumeur')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(MAX_RUMOR_LENGTH)
            .setPlaceholder('Écris ici la rumeur RP...');

          modal.addComponents(
            new ActionRowBuilder().addComponents(contentInput)
          );

          await interaction.showModal(modal);
          return;
        }

        if (action === 'rumor_prev') {
          page -= 1;
        } else if (action === 'rumor_next') {
          page += 1;
        }

        const nextMode = action === 'rumor_toggle'
          ? (mode === 'mine' ? 'all' : 'mine')
          : mode;

        const payload = await buildRumorPanel(
          interaction.guildId,
          interaction.guild,
          ownerUserId,
          slot,
          nextMode,
          page
        );

        if (!payload) {
          await interaction.reply({
            content: 'Impossible de recharger les rumeurs.',
            ephemeral: true
          });
          return;
        }

        await interaction.update(payload);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (!interaction.customId.startsWith('rumor_detail_select:')) {
          return;
        }

        const [, ownerUserId] = interaction.customId.split(':');
        const rumorId = interaction.values[0];

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            ephemeral: true
          });
          return;
        }

        const rumor = await Rumor.findOne({
          _id: rumorId,
          guildId: interaction.guildId
        }).lean();

        if (!rumor) {
          await interaction.reply({
            content: 'Cette rumeur est introuvable.',
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          embeds: [buildRumorDetailEmbed(rumor, interaction.guild)],
          ephemeral: true
        });

        return;
      }

      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('rumor_publish_modal:')) {
          return;
        }

        const [, ownerUserId, rawSlot, publishMode, viewMode, rawPage] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        const page = Number(rawPage) || 1;

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            ephemeral: true
          });
          return;
        }

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: ownerUserId,
          slot
        }).lean();

        if (!profile) {
          await interaction.reply({
            content: 'Ton profil actif est introuvable.',
            ephemeral: true
          });
          return;
        }

        const content = interaction.fields.getTextInputValue('content')?.trim() || '';

        if (!content) {
          await interaction.reply({
            content: 'Le contenu de la rumeur ne peut pas être vide.',
            ephemeral: true
          });
          return;
        }

        await Rumor.create({
          guildId: interaction.guildId,
          authorUserId: ownerUserId,
          authorSlot: slot,
          authorProfileNameSnapshot: profile.nomPrenom || `Profil ${ownerUserId} • Slot ${slot}`,
          content,
          anonymous: publishMode !== 'named',
          status: 'active'
        });

        const payload = await buildRumorPanel(
          interaction.guildId,
          interaction.guild,
          ownerUserId,
          slot,
          viewMode,
          page
        );

        await interaction.reply({
          content: 'Rumeur publiée avec succès.',
          ephemeral: true
        });

        await interaction.message?.edit(payload).catch(() => {});
      }
    } catch (error) {
      console.error('❌ Erreur interactions rumeur :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la gestion des rumeurs.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la gestion des rumeurs.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};