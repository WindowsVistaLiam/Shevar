const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { canManageReputation } = require('../../config/permissions');
const { formatModifier, clampMarketModifier } = require('../../utils/marketUtils');

function getRandomModifier() {
  return Math.floor(Math.random() * 21) - 10; // -10 → +10
}

async function applyToAllItems(guildId, callback) {
  const items = await ShopItem.find({
    guildId,
    isActive: true
  });

  const changes = [];

  for (const item of items) {
    const old = item.marketModifier || 0;

    const next = callback(item, old);

    item.marketModifier = clampMarketModifier(next);
    await item.save();

    changes.push({
      name: item.name,
      old,
      new: item.marketModifier
    });
  }

  return changes;
}

function buildPreview(changes) {
  const preview = changes.slice(0, 10).map(c =>
    `• **${c.name}** : ${formatModifier(c.old)} → ${formatModifier(c.new)}`
  );

  const remaining = changes.length - preview.length;

  return [
    ...preview,
    remaining > 0 ? `\n… et **${remaining}** autres objets` : ''
  ].join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Gestion du marché global')

    // 🎲 RANDOM
    .addSubcommand(sub =>
      sub
        .setName('random')
        .setDescription('Variation aléatoire du marché (-10% à +10%)')
    )

    // 💥 CRASH
    .addSubcommand(sub =>
      sub
        .setName('crash')
        .setDescription('Faire chuter le marché')
        .addIntegerOption(option =>
          option
            .setName('valeur')
            .setDescription('Baisse du marché (1 à 10)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )

    // 📈 INFLATION
    .addSubcommand(sub =>
      sub
        .setName('inflation')
        .setDescription('Faire monter le marché')
        .addIntegerOption(option =>
          option
            .setName('valeur')
            .setDescription('Hausse du marché (1 à 10)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: "Tu n'as pas la permission.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    let changes = [];

    // 🎲 RANDOM
    if (sub === 'random') {
      changes = await applyToAllItems(interaction.guildId, () => {
        return getRandomModifier();
      });

      await interaction.reply({
        content: [
          `🎲 **Marché aléatoire appliqué (${changes.length} objets)**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
    }

    // 💥 CRASH
    if (sub === 'crash') {
      const value = interaction.options.getInteger('valeur', true);

      changes = await applyToAllItems(interaction.guildId, (item, old) => {
        return old - value;
      });

      await interaction.reply({
        content: [
          `💥 **Crash du marché (-${value}%)**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
    }

    // 📈 INFLATION
    if (sub === 'inflation') {
      const value = interaction.options.getInteger('valeur', true);

      changes = await applyToAllItems(interaction.guildId, (item, old) => {
        return old + value;
      });

      await interaction.reply({
        content: [
          `📈 **Inflation du marché (+${value}%)**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
    }
  }
};