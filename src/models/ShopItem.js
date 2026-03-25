const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    itemId: { type: String, required: true },

    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Divers' },

    buyPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: -1 },

    isActive: { type: Boolean, default: true },

    equipable: { type: Boolean, default: false },
    equipmentSlot: {
      type: String,
      enum: [
        '',
        'tete',
        'torse',
        'jambes',
        'pieds',
        'mainDroite',
        'mainGauche',
        'accessoire1',
        'accessoire2'
      ],
      default: ''
    },

    icon: { type: String, default: '' },
    iconUrl: { type: String, default: '' },

    marketModifier: {
      type: Number,
      default: 0,
      min: -10,
      max: 10
    }
  },
  { timestamps: true }
);

shopItemSchema.index({ guildId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.models.ShopItem || mongoose.model('ShopItem', shopItemSchema);