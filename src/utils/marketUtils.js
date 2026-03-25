function clampMarketModifier(value) {
  return Number(value) || 0;
}

function applyMarketModifier(basePrice, modifierPercent) {
  const base = Math.max(0, Number(basePrice) || 0);
  const modifier = Number(modifierPercent) || 0;
  const factor = 1 + modifier / 100;

  return Math.max(1, Math.round(base * factor));
}

function formatModifier(modifierPercent) {
  const value = Number(modifierPercent) || 0;
  return value > 0 ? `+${value}%` : `${value}%`;
}

module.exports = {
  clampMarketModifier,
  applyMarketModifier,
  formatModifier
};