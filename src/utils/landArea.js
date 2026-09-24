/**
 * Land Area Formatting & Conversion Utilities for PANGAN-SENSE
 * Supports:
 * - Real agricultural fields: m² (meter persegi) & Ha (hektar)
 * - Research, testing & simulations: cm² (sentimeter persegi) & cm × cm (dimensi pot / tray uji)
 */

export function formatLandArea(land) {
  if (!land) return '0 m²';
  const unit = land.areaUnit || (land.areaM2 && land.areaM2 < 1 ? 'cm2' : land.areaM2 >= 10000 ? 'ha' : 'm2');
  const dims = land.dimensions;
  const areaM2 = Number(land.areaM2 || 0);

  if (unit === 'cm_dims' && dims && dims.length && dims.width) {
    const cm2 = Math.round(dims.length * dims.width);
    return `${dims.length}×${dims.width} cm (${cm2.toLocaleString('id-ID')} cm²)`;
  }

  if (unit === 'cm2' || (areaM2 > 0 && areaM2 < 1)) {
    const cm2 = Math.round(areaM2 * 10000);
    return `${cm2.toLocaleString('id-ID')} cm² (${areaM2 < 0.01 ? areaM2.toFixed(4) : areaM2.toFixed(2)} m²)`;
  }

  if (unit === 'ha' || areaM2 >= 10000) {
    return `${(areaM2 / 10000).toFixed(2)} Ha (${areaM2.toLocaleString('id-ID')} m²)`;
  }

  return `${areaM2.toLocaleString('id-ID')} m²`;
}

/**
 * Convert user input to areaM2 standard storage
 */
export function convertToAreaM2(unit, value, dims) {
  if (unit === 'cm_dims' && dims) {
    const l = Number(dims.length) || 0;
    const w = Number(dims.width) || 0;
    return (l * w) / 10000;
  }
  if (unit === 'cm2') {
    return (Number(value) || 0) / 10000;
  }
  if (unit === 'ha') {
    return (Number(value) || 0) * 10000;
  }
  return Number(value) || 0;
}
