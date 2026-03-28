const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lettre')
    .setDescription('Système de lettres'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xe0b84d)
      .setTitle('✉️ Système de Lettres')
      .setDescription([
        'Choisis une action :',
        '',
        '📝 **Rédiger** une lettre',
        '📬 **Boîte** de réception',
        '📦 **Archives**',
        '🗑️ **Corbeille**',
        '🕵️ **Intercepter** une lettre dans ta zone'
      ].join('\n'))
      .setFooter({
        text: `${interaction.guild?.name || 'Serveur RP'} • Lettres`
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`letter:menu_write:${interaction.user.id}`)
        .setLabel('Rédiger')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`letter:menu_inbox:${interaction.user.id}`)
        .setLabel('Boîte')
        .setEmoji('📬')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`letter:menu_archive:${interaction.user.id}`)
        .setLabel('Archives')
        .setEmoji('📦')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`letter:menu_trash:${interaction.user.id}`)
        .setLabel('Corbeille')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`letter:menu_intercept:${interaction.user.id}`)
        .setLabel('Intercepter')
        .setEmoji('🕵️')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};