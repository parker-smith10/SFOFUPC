// Best-effort mapping from an admin-entered option value (e.g. "Black") to a
// swatch color for the uniform preview. Falls back to a neutral gray for
// values that aren't recognized color words (e.g. logo names).
const KNOWN_COLORS = {
  black: '#111111',
  orange: '#ff7300',
  white: '#f5f3ef',
  gray: '#9a9a9a',
  grey: '#9a9a9a',
  cowboy: '#ff7300',
}

export function swatchColor(value) {
  if (!value) return '#c9c9c9'
  const key = value.trim().toLowerCase()
  return KNOWN_COLORS[key] || '#c9c9c9'
}

export function swatchTextColor(value) {
  const hex = swatchColor(value)
  // crude luminance check so text/borders stay legible on light swatches
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#111111' : '#f5f3ef'
}
