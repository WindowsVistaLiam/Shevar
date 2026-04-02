const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');

const Profile = require('../models/Profile');
const {
  buildRelationListEmbed,
  buildRelationDetailEmbed,
  getRelationPage,
  MAX_RELATIONS_PER_PROFILE,
} = require('../utils/relationEmbeds');
const { buildRelationRows } = require('../utils/relationComponents');

function normalizeText(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

async function buildRelationPanel(client, guildId, guild, ownerUserId, slot, page) {
  const profile = await Profile.findOne({ guildId, userId: ownerUserId, slot }).lean();
  if (!profile) return null;

  const ownerUser = await client.users.fetch(ownerUserId).catch(() => null);
  if (!ownerUser) return null;

  const pageData = getRelationPage(profile.relations || [], page);

  return {
    embeds: [buildRelationListEmbed(profile, ownerUser, guild, pageData.page)],
    components: buildRelationRows(
      ownerUserId,
      slot,
      pageData.page,
      pageData.totalPages,
      pageData.items
    ),
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
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if (action === 'relation_add') {
          const modal = new ModalBuilder()
            .setCustomId(`relation_add_modal:${ownerUserId}:${slot}:${page}`)
            .setTitle('Ajouter une relation');

          const targetNameInput = new TextInputBuilder()
            .setCustomId('targetName')
            .setLabel('Nom de la cible / relation')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(80)
            .setPlaceholder('Ex. Aelys, Guilde des Cendres, Maître inconnu...');

          const typeInput = new TextInputBuilder()
            .setCustomId('type')
            .setLabel('Type de relation')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(40)
            .setPlaceholder('Ex. Ami, Ennemi, Dette, Pacte, Obsession...');

          const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description RP')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(500)
            .setPlaceholder('Décris librement cette relation.');

          modal.addComponents(
            new ActionRowBuilder().addComponents(targetNameInput),
            new ActionRowBuilder().addComponents(typeInput),
            new ActionRowBuilder().addComponents(descriptionInput)
          );

          await interaction.showModal(modal);
          return;
        }

        if (action === 'relation_prev') page -= 1;
        if (action === 'relation_next') page += 1;

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
            flags: MessageFlags.Ephemeral,
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
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: ownerUserId,
          slot,
        });

        if (!profile) {
          await interaction.reply({
            content: 'Ce profil n’existe plus.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const relation = profile.relations.id(relationId);
        if (!relation) {
          await interaction.reply({
            content: 'Cette relation est introuvable.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const ownerUser = await client.users.fetch(ownerUserId).catch(() => null);
        if (!ownerUser) {
          await interaction.reply({
            content: 'Impossible de retrouver le propriétaire du profil.',
            flags: MessageFlags.Ephemeral,
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
            flags: MessageFlags.Ephemeral,
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
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          await interaction.update(payload);
          return;
        }
      }

      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('relation_add_modal:')) return;

        const [, ownerUserId, rawSlot] = interaction.customId.split(':');
        const slot = Number(rawSlot);

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: ownerUserId,
          slot,
        });

        if (!profile) {
          await interaction.reply({
            content: 'Ce profil n’existe plus.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if ((profile.relations || []).length >= MAX_RELATIONS_PER_PROFILE) {
          await interaction.reply({
            content: `Tu as déjà atteint la limite de **${MAX_RELATIONS_PER_PROFILE} relations** pour ce profil.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const targetName = normalizeText(interaction.fields.getTextInputValue('targetName'));
        const relationType = normalizeText(interaction.fields.getTextInputValue('type'));
        const description = normalizeText(
          interaction.fields.getTextInputValue('description') || ''
        );

        if (targetName.length < 2) {
          await interaction.reply({
            content: 'Le nom de la cible doit contenir au moins **2 caractères**.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if (relationType.length < 2) {
          await interaction.reply({
            content: 'Le type de relation doit contenir au moins **2 caractères**.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const alreadyExists = (profile.relations || []).some(relation => {
          const sameTarget =
            String(relation.targetNameSnapshot || '').toLowerCase() === targetName.toLowerCase();
          const sameType =
            String(relation.type || '').toLowerCase() === relationType.toLowerCase();

          return sameTarget && sameType;
        });

        if (alreadyExists) {
          await interaction.reply({
            content: 'Une relation avec cette même cible et ce même type existe déjà.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        profile.relations.push({
          targetNameSnapshot: targetName,
          type: relationType,
          description,
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
          flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la gestion des relations.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }
  });
};