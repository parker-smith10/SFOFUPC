export const CATEGORIES = [
  { key: 'helmet', label: 'Helmet' },
  { key: 'jersey', label: 'Jersey' },
  { key: 'pants', label: 'Pants' },
  { key: 'logo', label: 'Logo' },
]

export function scorePick(pick, game) {
  if (!pick || !game || !game.results_published) return null
  let points = 0
  for (const { key } of CATEGORIES) {
    if (pick[key] && game[`actual_${key}`] && pick[key] === game[`actual_${key}`]) {
      points += 1
    }
  }
  return points
}

export function hasFullActuals(game) {
  return CATEGORIES.every((c) => !!game[`actual_${c.key}`])
}
