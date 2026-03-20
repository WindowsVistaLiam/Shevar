const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const ExchangeHistory = require('../../models/ExchangeHistory');

function formatSide(side) {
  const lines = [];

  if ((side.money || 0) > 0) {
    lines.push(`💰 ${side.money} pièces`);
  }

  if (side.itemName && (side.itemQuantity || 0) > 0) {
    lines.push(`🎒 ${side.itemName} ×${side.itemQuantity}`);
  }

  return lines.length > 0 ? lines.join(', ') : 'Rien';
}

function formatStatus(status) {
  if (status === 'accepted') return '✅ Accepté';
  if (status === 'refused') return '❌ Refusé';
  if (status === 'expired') return '⌛ Expiré';
  if (status === 'failed') return '⚠️ Échec';
  return status;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historique-echanges')
    .setDescription('Voir l’historique des échanges')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;

    const entries = await ExchangeHistory.find({
      guildId: interaction.guildId,
      $or: [
        { senderId: targetUser.id },
        { receiverId: targetUser.id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (entries.length === 0) {
      await interaction.reply({
        content: `Aucun échange enregistré pour **${targetUser.username}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const lines = entries.map(entry => {
      const role = entry.senderId === targetUser.id ? 'Proposé' : 'Reçu';
      const otherUserId = entry.senderId === targetUser.id ? entry.receiverId : entry.senderId;

      return [
        `**${formatStatus(entry.status)}** • ${role} avec <@${otherUserId}>`,
        `Don : ${formatSide(entry.offer)}`,
        `Demande : ${formatSide(entry.request)}`,
        `Slots : ${entry.senderSlot} → ${entry.receiverSlot}`,
        entry.reason ? `Raison : ${entry.reason}` : null,
        `Date : <t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:R>`
      ].filter(Boolean).join('\n');
    });

    const embed = new EmbedBuilder()
      .setColor(0x8e44ad)
      .setTitle(`📚 Historique des échanges — ${targetUser.username}`)
      .setDescription(lines.join('\n\n'))
      .setFooter({
        text: '10 derniers échanges'
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};