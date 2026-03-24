const MJ_ROLE_IDS = [
  // Mets ici les IDs des rôles MJ autorisés
  1483120881290182801,
  1483120881290182802,
];

function hasMjRole(member) {
  if (!member || !member.roles?.cache) return false;
  return member.roles.cache.some(role => MJ_ROLE_IDS.includes(role.id));
}

function canManageReputation(member) {
  if (!member) return false;

  if (member.permissions?.has('Administrator')) {
    return true;
  }

  return hasMjRole(member);
}

module.exports = {
  MJ_ROLE_IDS,
  hasMjRole,
  canManageReputation
};