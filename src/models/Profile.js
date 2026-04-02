const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },

    equipable: { type: Boolean, default: false },
    equipmentSlot: { type: String, default: '' },

    icon: { type: String, default: '' },
    iconUrl: { type: String, default: '' }
  },
  { _id: true }
);

const relationSchema = new mongoose.Schema(
  {
    targetNameSnapshot: { type: String, required: true, default: '' },
    type: { type: String, default: '' },
    description: { type: String, default: '' },

    targetUserId: { type: String, default: '' },
    targetSlot: { type: Number, default: null },
    targetProfileNameSnapshot: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const titleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    slot: { type: Number, default: 1 },

    nomPrenom: { type: String, default: '' },
    ageGenre: { type: String, default: '' },
    description: { type: String, default: '' },
    pouvoir: { type: String, default: '' },
    metier: { type: String, default: '' },

    imageUrl: { type: String, default: '' },
    imageUrlPage2: { type: String, default: '' },

    location: { type: String, default: 'Aucune' },

    souillure: { type: Number, default: 0, min: 0, max: 100 },

    wallet: { type: Number, default: 0 },

    inventory: { type: [inventoryItemSchema], default: [] },

    equippedItems: {
      tete: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      torse: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      jambes: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      pieds: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      mainDroite: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      mainGauche: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      accessoire1: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      },
      accessoire2: {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemNameSnapshot: { type: String, default: '' },
        icon: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      }
    },

    relations: { type: [relationSchema], default: [] },

    titles: { type: [titleSchema], default: [] },
    equippedTitle: { type: String, default: '' },

    rpMessages: { type: Number, default: 0 },
    rpLevel: { type: Number, default: 1 },

    positiveReputation: { type: Number, default: 0 },
    negativeReputation: { type: Number, default: 0 },

    reputationHistory: [
      {
        type: {
          type: String,
          enum: ['positive', 'negative']
        },
        amount: Number,
        reason: String,
        authorId: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    customBackground: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

profileSchema.index(
  { guildId: 1, userId: 1, slot: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Profile || mongoose.model('Profile', profileSchema);