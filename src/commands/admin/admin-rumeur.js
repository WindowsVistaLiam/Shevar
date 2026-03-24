const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Rumor = require('../../models/rumor');
const { canManageReputation } = require('../../config/permissions');
const { buildPublishedRumorEmbed } = require('../../utils/rumorEmbeds');

function extractMessageReference(input = '') {
  const value = input.trim();

  if (!value) {
    return { type: null, value: null };
  }

  const messageLinkMatch = value.match(
    /^https?:\/\/(?:canary\.|ptb\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/
  );

  if (messageLinkMatch) {
    return {
      type: 'message_link',
      guildId: messageLinkMatch[1],
      channelId: messageLinkMatch[2],
      messageId: messageLinkMatch[3]
    };
  }

  const discordIdMatch = value.match(/^\d{17,20}$/);
  if (discordIdMatch) {
    return {
      type: 'discord_id',
      messageId: value
    };
  }

  const mongoIdMatch = value.match(/^[a-fA-F0-9]{24}$/);
  if (mongoIdMatch) {
    return {
      type: 'mongo_id',
      mongoId: value
    };
  }

  return { type: 'unknown', value };
}

async function findRumorByReference(guildId, reference) {
  const parsed = extractMessageReference(reference);

  if (!parsed.type || parsed.type === 'unknown') {
    return null;
  }

  if (parsed.type === 'mongo_id') {
    return Rumor.findOne({
      _id: parsed.mongoId,
      guildId
    });
  }

  if (parsed.type === 'discord_id') {
    return Rumor.findOne({
      guildId,
      messageId: parsed.messageId
    });
  }

  if (parsed.type === 'message_link') {
    if (parsed.guildId !== guildId) {
      return null;
    }

    return Rumor.findOne({
      guildId,
      channelId: parsed.channelId,
      messageId: parsed.messageId
    });
  }

  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin-rumeur')
    .setDescription('Gérer les rumeurs RP')
    .addSubcommand(sub =>
      sub
        .setName('archiver')
        .setDescription('Archiver une rumeur active')
        .addStringOption(option =>
          option
            .setName('reference')
            .setDescription('Lien du message, ID du message Discord, ou ID MongoDB')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('raison')
            .setDescription('Raison de l’archivage')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('supprimer')
        .setDescription('Supprimer une rumeur')
        .addStringOption(option =>
          option
            .setName('reference')
            .setDescription('Lien du message, ID du message Discord, ou ID MongoDB')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('raison')
            .setDescription('Raison de la suppression')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: 'Tu n’as pas la permission d’utiliser cette commande.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const reference = interaction.options.getString('reference', true);
    const reason = interaction.options.getString('raison') || 'Aucune raison précisée.';

    const rumor = await findRumorByReference(interaction.guildId, reference);

    if (!rumor) {
      await interaction.reply({
        content: [
          'Rumeur introuvable.',
          '',
          'Références acceptées :',
          '• lien du message Discord',
          '• ID du message Discord',
          '• ID MongoDB'
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'archiver') {
      rumor.status = 'archived';
    } else if (subcommand === 'supprimer') {
      rumor.status = 'deleted';
    }

    rumor.moderatedByUserId = interaction.user.id;
    rumor.moderationReason = reason;
    rumor.moderatedAt = new Date();

    await rumor.save();

    if (rumor.channelId && rumor.messageId) {
      const channel = await interaction.guild.channels.fetch(rumor.channelId).catch(() => null);

      if (channel?.isTextBased()) {
        const message = await channel.messages.fetch(rumor.messageId).catch(() => null);

        if (message) {
          if (subcommand === 'archiver') {
            const archivedEmbed = buildPublishedRumorEmbed(rumor)
              .setTitle('📦 Rumeur archivée')
              .setFooter({
                text: `Rumeur archivée par le staff • ${reason}`
              });

            await message.edit({
              embeds: [archivedEmbed],
              components: []
            }).catch(() => {});
          } else {
            await message.edit({
              content: '🗑️ Cette rumeur a été supprimée par le staff.',
              embeds: [],
              components: []
            }).catch(() => {});
          }
        }
      }
    }

    await interaction.reply({
      content: [
        `Rumeur **${subcommand === 'archiver' ? 'archivée' : 'supprimée'}** avec succès.`,
        `Référence utilisée : \`${reference}\``,
        `ID base : \`${rumor._id}\``,
        `Raison : ${reason}`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};