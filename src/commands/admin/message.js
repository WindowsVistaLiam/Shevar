const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { canManageReputation } = require('../../config/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('message')
    .setDescription('Envoyer un message stylisé en embed')
    .addStringOption(option =>
      option
        .setName('texte')
        .setDescription('Contenu du message')
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addStringOption(option =>
      option
        .setName('image')
        .setDescription('URL de l’image à afficher')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Titre de l’embed')
        .setRequired(false)
        .setMaxLength(100)
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: "Tu n'as pas la permission.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const texte = interaction.options.getString('texte', true);
    const image = interaction.options.getString('image');
    const titre = interaction.options.getString('titre');

    // 🎨 Couleur RP (cohérente avec ton bot)
    const embed = new EmbedBuilder()
      .setColor(0xe0b84d) // doré RP
      .setDescription(`*${texte}*`)
      .setFooter({
        text: `${interaction.guild?.name || 'Serveur RP'} • Message RP`
      })
      .setTimestamp();

    if (titre) {
      embed.setTitle(`✦ ${titre}`);
    }

    if (image && image.startsWith('http')) {
      embed.setImage(image);
    }

    await interaction.reply({
      embeds: [embed]
    });
  }
};