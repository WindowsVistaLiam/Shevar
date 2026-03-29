const mongoose = require('mongoose');

const letterSchema = new mongoose.Schema(
  {
    guildId: String,

    senderId: String,
    receiverId: String,

    senderNameSnapshot: String,
    receiverNameSnapshot: String,

    subject: String,
    content: String,

    location: String,

    status: {
      type: String,
      enum: ['sent', 'archived', 'deleted'],
      default: 'sent'
    },

    isAnonymous: { type: Boolean, default: false },

    interceptedBy: [String],

    // 🆕 conversation
    replyTo: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Letter || mongoose.model('Letter', letterSchema);