const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { canManageReputation } = require('../../config/permissions');
const { formatModifier } = require('../../utils/marketUtils');

function getRandomModifier() {
  return Math.floor(Math.random() * 21) - 10;
}

async function applyToAllItems(guildId, callback) {
  const items = await ShopItem.find({
    guildId,
    isActive: true
  });

  const changes = [];

  for (const item of items) {
    const old = Number(item.marketModifier) || 0;
    const next = callback(item, old);

    item.marketModifier = Number(next) || 0;
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
  const preview = changes.slice(0, 10).map(change =>
    `• **${change.name}** : ${formatModifier(change.old)} → ${formatModifier(change.new)}`
  );

  const remaining = changes.length - preview.length;
  if (remaining > 0) {
    preview.push(``);
    preview.push(`… et **${remaining}** autre(s) objet(s)`);
  }

  return preview.join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Gestion globale du marché')
    .addSubcommand(sub =>
      sub
        .setName('random')
        .setDescription('Appliquer une variation aléatoire du marché à tous les objets')
    )
    .addSubcommand(sub =>
      sub
        .setName('crash')
        .setDescription('Faire baisser le marché')
        .addIntegerOption(option =>
          option
            .setName('valeur')
            .setDescription('Baisse en pourcentage')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('inflation')
        .setDescription('Faire monter le marché')
        .addIntegerOption(option =>
          option
            .setName('valeur')
            .setDescription('Hausse en pourcentage')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Remettre le marché à 0% sur tous les objets')
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: "Tu n'as pas la permission d'utiliser cette commande.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'random') {
      const changes = await applyToAllItems(interaction.guildId, () => getRandomModifier());

      await interaction.reply({
        content: [
          `🎲 **Marché aléatoire appliqué**`,
          `Objets modifiés : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'crash') {
      const value = interaction.options.getInteger('valeur', true);

      const changes = await applyToAllItems(interaction.guildId, (item, old) => old - value);

      await interaction.reply({
        content: [
          `💥 **Crash du marché**`,
          `Variation appliquée : **-${value}%**`,
          `Objets modifiés : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'inflation') {
      const value = interaction.options.getInteger('valeur', true);

      const changes = await applyToAllItems(interaction.guildId, (item, old) => old + value);

      await interaction.reply({
        content: [
          `📈 **Inflation du marché**`,
          `Variation appliquée : **+${value}%**`,
          `Objets modifiés : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'reset') {
      const changes = await applyToAllItems(interaction.guildId, () => 0);

      await interaction.reply({
        content: [
          `🧼 **Marché réinitialisé**`,
          `Objets remis à **0%** : **${changes.length}**`
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
    }
  }
};