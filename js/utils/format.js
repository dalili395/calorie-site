window.CalorieUtils = window.CalorieUtils || {};

window.CalorieUtils.formatNumber = function formatNumber(value, digits = 1) {
  const rounded = Number(value.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};
