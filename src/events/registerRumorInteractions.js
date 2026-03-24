const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');

const Profile = require('../models/Profile');
const Rumor = require('../models/rumor');
const {
  buildRumorListEmbed,
  buildRumorDetailEmbed,
  buildPublishedRumorEmbed,
  getRumorPage,
  MAX_RUMOR_LENGTH,
  RUMOR_CHANNEL_ID
} = require('../utils/rumorEmbeds');
const {
  buildRumorRows,
  buildPublishedRumorRows
} = require('../utils/rumorComponents');

function parseTargetUserId(rawValue = '') {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const mentionMatch = trimmed.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return mentionMatch[1];

  const idMatch = trimmed.match(/^\d{17,20}$/);
  if (idMatch) return idMatch[0];

  return null;
}

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

async function updatePublishedRumorMessage(client, rumor) {
  if (!rumor?.channelId || !rumor?.messageId) return;

  const channel = await client.channels.fetch(rumor.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const message = await channel.messages.fetch(rumor.messageId).catch(() => null);
  if (!message) return;

  await message.edit({
    embeds: [buildPublishedRumorEmbed(rumor)],
    components: buildPublishedRumorRows(rumor._id.toString())
  }).catch(() => {});
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
          !interaction.customId.startsWith('rumor_publish_named:') &&
          !interaction.customId.startsWith('rumor_believe:') &&
          !interaction.customId.startsWith('rumor_deny:')
        ) {
          return;
        }

        if (
          interaction.customId.startsWith('rumor_believe:') ||
          interaction.customId.startsWith('rumor_deny:')
        ) {
          const [action, rumorId] = interaction.customId.split(':');

          const rumor = await Rumor.findOne({
            _id: rumorId,
            guildId: interaction.guildId,
            status: 'active'
          });

          if (!rumor) {
            await interaction.reply({
              content: 'Cette rumeur est introuvable.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const userId = interaction.user.id;
          const believers = new Set(rumor.believers || []);
          const deniers = new Set(rumor.deniers || []);

          if (action === 'rumor_believe') {
            if (believers.has(userId)) {
              believers.delete(userId);
            } else {
              believers.add(userId);
              deniers.delete(userId);
            }
          } else {
            if (deniers.has(userId)) {
              deniers.delete(userId);
            } else {
              deniers.add(userId);
              believers.delete(userId);
            }
          }

          rumor.believers = [...believers];
          rumor.deniers = [...deniers];
          await rumor.save();

          await updatePublishedRumorMessage(client, rumor);

          await interaction.reply({
            content: action === 'rumor_believe'
              ? 'Ton avis sur cette rumeur a été mis à jour : **Croire**.'
              : 'Ton avis sur cette rumeur a été mis à jour : **Nier**.',
            flags: MessageFlags.Ephemeral
          });

          return;
        }

        const [action, ownerUserId, rawSlot, mode, rawPage] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        let page = Number(rawPage) || 1;

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral
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

          const targetUserInput = new TextInputBuilder()
            .setCustomId('targetUser')
            .setLabel('Cible (mention/ID ou vide)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(30)
            .setPlaceholder('@Utilisateur ou ID Discord');

          const targetSlotInput = new TextInputBuilder()
            .setCustomId('targetSlot')
            .setLabel('Slot cible (ou vide)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(2)
            .setPlaceholder('1');

          modal.addComponents(
            new ActionRowBuilder().addComponents(contentInput),
            new ActionRowBuilder().addComponents(targetUserInput),
            new ActionRowBuilder().addComponents(targetSlotInput)
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
            flags: MessageFlags.Ephemeral
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
            flags: MessageFlags.Ephemeral
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
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await interaction.reply({
          embeds: [buildRumorDetailEmbed(rumor, interaction.guild)],
          flags: MessageFlags.Ephemeral
        });

        return;
      }

      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('rumor_publish_modal:')) {
          return;
        }

        const [, ownerUserId, rawSlot, publishMode] = interaction.customId.split(':');
        const slot = Number(rawSlot);

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral
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
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const content = interaction.fields.getTextInputValue('content')?.trim() || '';
        const targetUserRaw = interaction.fields.getTextInputValue('targetUser')?.trim() || '';
        const targetSlotRaw = interaction.fields.getTextInputValue('targetSlot')?.trim() || '';

        if (!content) {
          await interaction.reply({
            content: 'Le contenu de la rumeur ne peut pas être vide.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        let targetUserId = null;
        let targetSlot = null;
        let targetProfileNameSnapshot = '';

        if (targetUserRaw || targetSlotRaw) {
          targetUserId = parseTargetUserId(targetUserRaw);

          if (!targetUserId) {
            await interaction.reply({
              content: 'La cible indiquée est invalide. Utilise une mention, un ID Discord valide, ou laisse vide.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          targetSlot = Number(targetSlotRaw || '1');

          if (!Number.isInteger(targetSlot) || targetSlot < 1 || targetSlot > 10) {
            await interaction.reply({
              content: 'Le slot cible doit être un nombre entre **1** et **10**.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const targetProfile = await Profile.findOne({
            guildId: interaction.guildId,
            userId: targetUserId,
            slot: targetSlot
          }).lean();

          if (!targetProfile) {
            await interaction.reply({
              content: `Aucun profil trouvé pour cette cible dans le **slot ${targetSlot}**.`,
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          targetProfileNameSnapshot = targetProfile.nomPrenom || `Profil ${targetUserId} • Slot ${targetSlot}`;
        }

        const rumor = await Rumor.create({
          guildId: interaction.guildId,
          authorUserId: ownerUserId,
          authorSlot: slot,
          authorProfileNameSnapshot: profile.nomPrenom || `Profil ${ownerUserId} • Slot ${slot}`,
          targetUserId,
          targetSlot,
          targetProfileNameSnapshot,
          content,
          anonymous: publishMode !== 'named',
          believers: [],
          deniers: [],
          status: 'active'
        });

        const rumorChannel = await interaction.guild.channels.fetch(RUMOR_CHANNEL_ID).catch(() => null);

        if (!rumorChannel || !rumorChannel.isTextBased()) {
          await interaction.reply({
            content: `La rumeur a été enregistrée, mais le salon public \`${RUMOR_CHANNEL_ID}\` est introuvable ou invalide.`,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const publicMessage = await rumorChannel.send({
          embeds: [buildPublishedRumorEmbed(rumor)],
          components: buildPublishedRumorRows(rumor._id.toString())
        });

        rumor.channelId = rumorChannel.id;
        rumor.messageId = publicMessage.id;
        await rumor.save();

        await interaction.reply({
          content: `Rumeur publiée dans <#${RUMOR_CHANNEL_ID}> avec succès.`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      console.error('❌ Erreur interactions rumeur :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la gestion des rumeurs.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la gestion des rumeurs.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};