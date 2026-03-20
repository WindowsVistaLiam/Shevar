const mongoose = require('mongoose');

const exchangeSideSchema = new mongoose.Schema(
  {
    money: {
      type: Number,
      default: 0,
      min: 0
    },
    itemName: {
      type: String,
      default: ''
    },
    itemQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const exchangeHistorySchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true,
      index: true
    },
    senderSlot: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    receiverId: {
      type: String,
      required: true,
      index: true
    },
    receiverSlot: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    offer: {
      type: exchangeSideSchema,
      required: true
    },
    request: {
      type: exchangeSideSchema,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['accepted', 'refused', 'expired', 'failed']
    },
    reason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

exchangeHistorySchema.index({ guildId: 1, createdAt: -1 });
exchangeHistorySchema.index({ guildId: 1, senderId: 1, createdAt: -1 });
exchangeHistorySchema.index({ guildId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('ExchangeHistory', exchangeHistorySchema);