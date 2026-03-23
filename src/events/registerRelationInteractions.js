const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');

const Profile = require('../models/Profile');
const {
  buildRelationListEmbed,
  buildRelationDetailEmbed,
  getRelationPage,
  ALLOWED_RELATION_TYPES,
  MAX_RELATIONS_PER_PROFILE
} = require('../utils/relationEmbeds');
const { buildRelationRows } = require('../utils/relationComponents');

function parseTargetUserId(rawValue = '') {
  const trimmed = rawValue.trim();
  const mentionMatch = trimmed.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return mentionMatch[1];

  const idMatch = trimmed.match(/^\d{17,20}$/);
  if (idMatch) return idMatch[0];

  return null;
}

function normalizeRelationType(value = '') {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function buildRelationPanel(client, guildId, guild, ownerUserId, slot, page) {
  const profile = await Profile.findOne({
    guildId,
    userId: ownerUserId,
    slot
  }).lean();

  if (!profile) {
    return null;
  }

  const ownerUser = await client.users.fetch(ownerUserId).catch(() => null);
  if (!ownerUser) {
    return null;
  }

  const pageData = getRelationPage(profile.relations || [], page);

  return {
    embeds: [buildRelationListEmbed(profile, ownerUser, guild, pageData.page)],
    components: buildRelationRows(
      ownerUserId,
      slot,
      pageData.page,
      pageData.totalPages,
      pageData.items
    )
  };
}

module.exports = function registerRelationInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isButton()) {
        if (
          !interaction.customId.startsWith('relation_prev:') &&
          !interaction.customId.startsWith('relation_next:') &&
          !interaction.customId.startsWith('relation_add:')
        ) {
          return;
        }

        const [action, ownerUserId, rawSlot, rawPage] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        let page = Number(rawPage) || 1;

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (action === 'relation_add') {
          const modal = new ModalBuilder()
            .setCustomId(`relation_add_modal:${ownerUserId}:${slot}:${page}`)
            .setTitle('Ajouter une relation');

          const targetUserInput = new TextInputBuilder()
            .setCustomId('targetUser')
            .setLabel('Utilisateur cible')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(30)
            .setPlaceholder('@Utilisateur ou ID Discord');

          const targetSlotInput = new TextInputBuilder()
            .setCustomId('targetSlot')
            .setLabel('Slot cible')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(2)
            .setPlaceholder('1');

          const typeInput = new TextInputBuilder()
            .setCustomId('type')
            .setLabel('Type de relation')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(20)
            .setPlaceholder('allie, rival, famille...');

          const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description RP')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(300)
            .setPlaceholder('Décris brièvement cette relation RP.');

          modal.addComponents(
            new ActionRowBuilder().addComponents(targetUserInput),
            new ActionRowBuilder().addComponents(targetSlotInput),
            new ActionRowBuilder().addComponents(typeInput),
            new ActionRowBuilder().addComponents(descriptionInput)
          );

          await interaction.showModal(modal);
          return;
        }

        if (action === 'relation_prev') {
          page -= 1;
        } else if (action === 'relation_next') {
          page += 1;
        }

        const payload = await buildRelationPanel(
          client,
          interaction.guildId,
          interaction.guild,
          ownerUserId,
          slot,
          page
        );

        if (!payload) {
          await interaction.reply({
            content: 'Impossible de retrouver ce profil.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await interaction.update(payload);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (
          !interaction.customId.startsWith('relation_detail_select:') &&
          !interaction.customId.startsWith('relation_delete_select:')
        ) {
          return;
        }

        const [action, ownerUserId, rawSlot, rawPage] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        const page = Number(rawPage) || 1;
        const relationId = interaction.values[0];

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
        });

        if (!profile) {
          await interaction.reply({
            content: 'Ce profil n’existe plus.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const relation = profile.relations.id(relationId);

        if (!relation) {
          await interaction.reply({
            content: 'Cette relation est introuvable.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const ownerUser = await client.users.fetch(ownerUserId).catch(() => null);
        if (!ownerUser) {
          await interaction.reply({
            content: 'Impossible de retrouver le propriétaire du profil.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (action === 'relation_detail_select') {
          const embed = buildRelationDetailEmbed(
            profile.toObject(),
            ownerUser,
            relation.toObject(),
            interaction.guild
          );

          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (action === 'relation_delete_select') {
          relation.deleteOne();
          await profile.save();

          const payload = await buildRelationPanel(
            client,
            interaction.guildId,
            interaction.guild,
            ownerUserId,
            slot,
            page
          );

          if (!payload) {
            await interaction.reply({
              content: 'Impossible de recharger les relations.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          await interaction.update(payload);
          return;
        }
      }

      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('relation_add_modal:')) {
          return;
        }

        const [, ownerUserId, rawSlot] = interaction.customId.split(':');
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
        });

        if (!profile) {
          await interaction.reply({
            content: 'Ce profil n’existe plus.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if ((profile.relations || []).length >= MAX_RELATIONS_PER_PROFILE) {
          await interaction.reply({
            content: `Tu as déjà atteint la limite de **${MAX_RELATIONS_PER_PROFILE} relations** pour ce profil.`,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const targetUserRaw = interaction.fields.getTextInputValue('targetUser');
        const targetSlotRaw = interaction.fields.getTextInputValue('targetSlot');
        const typeRaw = interaction.fields.getTextInputValue('type');
        const description = interaction.fields.getTextInputValue('description')?.trim() || '';

        const targetUserId = parseTargetUserId(targetUserRaw);
        const targetSlot = Number(targetSlotRaw);
        const relationType = normalizeRelationType(typeRaw);

        if (!targetUserId) {
          await interaction.reply({
            content: 'Utilisateur cible invalide. Utilise une mention ou un ID Discord valide.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (!Number.isInteger(targetSlot) || targetSlot < 1 || targetSlot > 10) {
          await interaction.reply({
            content: 'Le slot cible doit être un nombre entre **1** et **10**.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (!ALLOWED_RELATION_TYPES.includes(relationType)) {
          await interaction.reply({
            content: `Type invalide. Types autorisés : **${ALLOWED_RELATION_TYPES.join(', ')}**.`,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (targetUserId === ownerUserId && targetSlot === slot) {
          await interaction.reply({
            content: 'Tu ne peux pas créer une relation avec le même profil.',
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
            content: `Aucun profil trouvé pour cet utilisateur dans le **slot ${targetSlot}**.`,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const alreadyExists = (profile.relations || []).some(
          relation =>
            relation.targetUserId === targetUserId &&
            Number(relation.targetSlot) === targetSlot
        );

        if (alreadyExists) {
          await interaction.reply({
            content: 'Une relation vers ce profil existe déjà.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        profile.relations.push({
          targetUserId,
          targetSlot,
          targetProfileNameSnapshot:
            targetProfile.nomPrenom || `Profil ${targetUserId} • Slot ${targetSlot}`,
          type: relationType,
          description
        });

        await profile.save();

        const totalRelations = profile.relations.length;
        const totalPages = Math.max(1, Math.ceil(totalRelations / 5));
        const payload = await buildRelationPanel(
          client,
          interaction.guildId,
          interaction.guild,
          ownerUserId,
          slot,
          totalPages
        );

        await interaction.reply({
          content: 'Relation ajoutée avec succès.',
          flags: MessageFlags.Ephemeral
        });

        if (payload && interaction.message) {
          await interaction.message.edit(payload).catch(() => {});
        }
      }
    } catch (error) {
      console.error('❌ Erreur interactions relation :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la gestion des relations.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la gestion des relations.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};