const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-objet')
    .setDescription('Ajoute un objet à l’inventaire d’un profil')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Nom de l’objet')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('Quantité à ajouter')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon profil actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addBooleanOption(option =>
      option
        .setName('equipable')
        .setDescription('Cet objet est-il équipable ?')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('slot_equipement')
        .setDescription('Slot d’équipement si équipable')
        .setRequired(false)
        .addChoices(
          { name: 'Tête', value: 'tete' },
          { name: 'Torse', value: 'torse' },
          { name: 'Jambes', value: 'jambes' },
          { name: 'Pieds', value: 'pieds' },
          { name: 'Main droite', value: 'mainDroite' },
          { name: 'Main gauche', value: 'mainGauche' },
          { name: 'Accessoire 1', value: 'accessoire1' },
          { name: 'Accessoire 2', value: 'accessoire2' }
        )
    )
    .addStringOption(option =>
      option
        .setName('icone')
        .setDescription('Nom du fichier icône dans src/assets/inventory/items/')
        .setRequired(false)
        .setMaxLength(100)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const nom = interaction.options.getString('nom', true).trim();
    const quantite = interaction.options.getInteger('quantite', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const equipable = interaction.options.getBoolean('equipable') || false;
    const equipmentSlot = interaction.options.getString('slot_equipement') || '';
    const icon = (interaction.options.getString('icone') || '').trim();

    if (equipable && !equipmentSlot) {
      await interaction.reply({
        content: 'Tu dois préciser un **slot d’équipement** si l’objet est équipable.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    let profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      profile = await Profile.create({
        guildId: interaction.guildId,
        userId: targetUser.id,
        slot
      });
    }

    const existingItem = profile.inventory.find(
      item =>
        item.name.toLowerCase() === nom.toLowerCase() &&
        Boolean(item.equipable) === Boolean(equipable) &&
        (item.equipmentSlot || '') === (equipable ? equipmentSlot : '') &&
        (item.icon || '') === (equipable ? icon : '')
    );

    if (existingItem) {
      existingItem.quantity += quantite;
    } else {
      profile.inventory.push({
        name: nom,
        quantity: quantite,
        equipable,
        equipmentSlot: equipable ? equipmentSlot : '',
        icon: equipable ? icon : ''
      });
    }

    await profile.save();

    await interaction.reply({
      content: [
        `✅ Objet ajouté à **${targetUser.username}** (**slot ${slot}**)`,
        `Objet : **${nom}** ×${quantite}`,
        `Équipable : **${equipable ? 'Oui' : 'Non'}**`,
        `Slot équipement : **${equipable ? equipmentSlot : 'Aucun'}**`,
        `Icône : **${equipable ? (icon || 'Aucune') : 'Aucune'}**`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};