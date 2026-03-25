function clampMarketModifier(value) {
  const n = Number(value) || 0;
  return Math.max(-10, Math.min(10, n));
}

function applyMarketModifier(basePrice, modifierPercent) {
  const base = Math.max(0, Number(basePrice) || 0);
  const modifier = clampMarketModifier(modifierPercent);
  const factor = 1 + modifier / 100;
  return Math.max(0, Math.round(base * factor));
}

function formatModifier(modifierPercent) {
  const value = clampMarketModifier(modifierPercent);
  return value > 0 ? `+${value}%` : `${value}%`;
}

module.exports = {
  clampMarketModifier,
  applyMarketModifier,
  formatModifier
};