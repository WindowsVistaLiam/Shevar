const Profile = require('../models/Profile');
const { getTrade, deleteTrade, isTradeExpired } = require('../utils/tradeStore');
const { saveExchangeHistory } = require('../utils/exchangeHistoryService');

function findItem(profile, itemName) {
  return profile.inventory.find(
    item => item.name.toLowerCase() === itemName.toLowerCase()
  );
}

function addItem(profile, itemName, quantity) {
  const existingItem = findItem(profile, itemName);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    profile.inventory.push({
      name: itemName,
      quantity
    });
  }
}

function removeItem(profile, itemName, quantity) {
  const existingItem = findItem(profile, itemName);

  if (!existingItem || existingItem.quantity < quantity) {
    return false;
  }

  existingItem.quantity -= quantity;

  if (existingItem.quantity <= 0) {
    profile.inventory = profile.inventory.filter(
      item => item.name.toLowerCase() !== itemName.toLowerCase()
    );
  }

  return true;
}

module.exports = function registerExchangeConfirmations(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (
      !interaction.customId.startsWith('exchange_accept:') &&
      !interaction.customId.startsWith('exchange_refuse:')
    ) {
      return;
    }

    try {
      const [action, tradeId] = interaction.customId.split(':');
      const trade = getTrade(tradeId);

      if (!trade || trade.type !== 'exchange_proposal') {
        await interaction.reply({
          content: 'Cette proposition d’échange est introuvable ou déjà traitée.',
          flags: 64
        });
        return;
      }

      if (interaction.user.id !== trade.receiverId) {
        await interaction.reply({
          content: 'Seul le destinataire peut répondre à cette proposition.',
          flags: 64
        });
        return;
      }

      if (isTradeExpired(trade)) {
        deleteTrade(tradeId);

        await saveExchangeHistory({
          guildId: trade.guildId,
          senderId: trade.senderId,
          senderSlot: trade.senderSlot,
          receiverId: trade.receiverId,
          receiverSlot: trade.receiverSlot,
          offer: trade.offer,
          request: trade.request,
          status: 'expired',
          reason: 'La proposition a expiré avant réponse.'
        });

        await interaction.update({
          content: '⌛ Cette proposition d’échange a expiré.',
          embeds: [],
          components: []
        });

        return;
      }

      if (action === 'exchange_refuse') {
        deleteTrade(tradeId);

        await saveExchangeHistory({
          guildId: trade.guildId,
          senderId: trade.senderId,
          senderSlot: trade.senderSlot,
          receiverId: trade.receiverId,
          receiverSlot: trade.receiverSlot,
          offer: trade.offer,
          request: trade.request,
          status: 'refused',
          reason: 'Le destinataire a refusé la proposition.'
        });

        await interaction.update({
          content: `❌ <@${trade.receiverId}> a refusé la proposition d’échange.`,
          embeds: [],
          components: []
        });

        return;
      }

      const senderProfile = await Profile.findOne({
        guildId: trade.guildId,
        userId: trade.senderId,
        slot: trade.senderSlot
      });

      const receiverProfile = await Profile.findOne({
        guildId: trade.guildId,
        userId: trade.receiverId,
        slot: trade.receiverSlot
      });

      if (!senderProfile || !receiverProfile) {
        deleteTrade(tradeId);

        await saveExchangeHistory({
          guildId: trade.guildId,
          senderId: trade.senderId,
          senderSlot: trade.senderSlot,
          receiverId: trade.receiverId,
          receiverSlot: trade.receiverSlot,
          offer: trade.offer,
          request: trade.request,
          status: 'failed',
          reason: 'L’un des profils impliqués est introuvable.'
        });

        await interaction.update({
          content: '❌ L’un des profils impliqués est introuvable. Échange annulé.',
          embeds: [],
          components: []
        });

        return;
      }

      if ((trade.offer.money || 0) > 0 && (senderProfile.wallet || 0) < trade.offer.money) {
        deleteTrade(tradeId);

        await saveExchangeHistory({
          guildId: trade.guildId,
          senderId: trade.senderId,
          senderSlot: trade.senderSlot,
          receiverId: trade.receiverId,
          receiverSlot: trade.receiverSlot,
          offer: trade.offer,
          request: trade.request,
          status: 'failed',
          reason: 'Le joueur 1 ne possède plus assez d’argent.'
        });

        await interaction.update({
          content: '❌ Le joueur 1 ne possède plus assez d’argent. Échange annulé.',
          embeds: [],
          components: []
        });

        return;
      }

      if ((trade.request.money || 0) > 0 && (receiverProfile.wallet || 0) < trade.request.money) {
        deleteTrade(tradeId);

        await saveExchangeHistory({
          guildId: trade.guildId,
          senderId: trade.senderId,
          senderSlot: trade.senderSlot,
          receiverId: trade.receiverId,
          receiverSlot: trade.receiverSlot,
          offer: trade.offer,
          request: trade.request,
          status: 'failed',
          reason: 'Le joueur 2 ne possède plus assez d’argent.'
        });

        await interaction.update({
          content: '❌ Le joueur 2 ne possède plus assez d’argent. Échange annulé.',
          embeds: [],
          components: []
        });

        return;
      }

      if (trade.offer.itemName && trade.offer.itemQuantity > 0) {
        const item = findItem(senderProfile, trade.offer.itemName);

        if (!item || item.quantity < trade.offer.itemQuantity) {
          deleteTrade(tradeId);

          await saveExchangeHistory({
            guildId: trade.guildId,
            senderId: trade.senderId,
            senderSlot: trade.senderSlot,
            receiverId: trade.receiverId,
            receiverSlot: trade.receiverSlot,
            offer: trade.offer,
            request: trade.request,
            status: 'failed',
            reason: 'Le joueur 1 ne possède plus assez de cet objet.'
          });

          await interaction.update({
            content: '❌ Le joueur 1 ne possède plus assez de cet objet. Échange annulé.',
            embeds: [],
            components: []
          });

          return;
        }
      }

      if (trade.request.itemName && trade.request.itemQuantity > 0) {
        const item = findItem(receiverProfile, trade.request.itemName);

        if (!item || item.quantity < trade.request.itemQuantity) {
          deleteTrade(tradeId);

          await saveExchangeHistory({
            guildId: trade.guildId,
            senderId: trade.senderId,
            senderSlot: trade.senderSlot,
            receiverId: trade.receiverId,
            receiverSlot: trade.receiverSlot,
            offer: trade.offer,
            request: trade.request,
            status: 'failed',
            reason: 'Le joueur 2 ne possède plus assez de cet objet.'
          });

          await interaction.update({
            content: '❌ Le joueur 2 ne possède plus assez de cet objet. Échange annulé.',
            embeds: [],
            components: []
          });

          return;
        }
      }

      if ((trade.offer.money || 0) > 0) {
        senderProfile.wallet -= trade.offer.money;
        receiverProfile.wallet = (receiverProfile.wallet || 0) + trade.offer.money;
      }

      if ((trade.request.money || 0) > 0) {
        receiverProfile.wallet -= trade.request.money;
        senderProfile.wallet = (senderProfile.wallet || 0) + trade.request.money;
      }

      if (trade.offer.itemName && trade.offer.itemQuantity > 0) {
        removeItem(senderProfile, trade.offer.itemName, trade.offer.itemQuantity);
        addItem(receiverProfile, trade.offer.itemName, trade.offer.itemQuantity);
      }

      if (trade.request.itemName && trade.request.itemQuantity > 0) {
        removeItem(receiverProfile, trade.request.itemName, trade.request.itemQuantity);
        addItem(senderProfile, trade.request.itemName, trade.request.itemQuantity);
      }

      await senderProfile.save();
      await receiverProfile.save();

      deleteTrade(tradeId);

      await saveExchangeHistory({
        guildId: trade.guildId,
        senderId: trade.senderId,
        senderSlot: trade.senderSlot,
        receiverId: trade.receiverId,
        receiverSlot: trade.receiverSlot,
        offer: trade.offer,
        request: trade.request,
        status: 'accepted',
        reason: 'La proposition a été acceptée.'
      });

      await interaction.update({
        content:
          `✅ Échange accepté entre <@${trade.senderId}> et <@${trade.receiverId}>.\n` +
          `**Slot joueur 1 :** ${trade.senderSlot} • **Slot joueur 2 :** ${trade.receiverSlot}`,
        embeds: [],
        components: []
      });
    } catch (error) {
      console.error('❌ Erreur confirmation échange :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la confirmation de l’échange.',
          flags: 64
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la confirmation de l’échange.',
          flags: 64
        }).catch(() => {});
      }
    }
  });
};