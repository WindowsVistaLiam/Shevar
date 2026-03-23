const mongoose = require('mongoose');

const rumorSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },

    authorUserId: { type: String, required: true, index: true },
    authorSlot: { type: Number, required: true, min: 1, max: 10 },
    authorProfileNameSnapshot: { type: String, default: '' },

    content: { type: String, required: true, maxlength: 500 },
    anonymous: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active'
    }
  },
  { timestamps: true }
);

rumorSchema.index({ guildId: 1, createdAt: -1 });
rumorSchema.index({ guildId: 1, authorUserId: 1, authorSlot: 1, createdAt: -1 });

module.exports = mongoose.model('Rumor', rumorSchema);