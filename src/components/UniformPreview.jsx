import { swatchColor, swatchTextColor } from '../lib/colorMap'

export default function UniformPreview({ helmet, jersey, pants, logo, size = 'md' }) {
  const helmetColor = swatchColor(helmet)
  const jerseyColor = swatchColor(jersey)
  const pantsColor = swatchColor(pants)
  const dims = size === 'sm' ? { w: 84, h: 110 } : { w: 140, h: 180 }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 140 180"
        width={dims.w}
        height={dims.h}
        role="img"
        aria-label={`Helmet: ${helmet || '?'}, Jersey: ${jersey || '?'}, Pants: ${pants || '?'}, Logo: ${logo || '?'}`}
      >
        {/* pants */}
        <rect x="42" y="128" width="20" height="44" rx="4" fill={pantsColor} stroke="#00000022" />
        <rect x="78" y="128" width="20" height="44" rx="4" fill={pantsColor} stroke="#00000022" />
        {/* jersey */}
        <path
          d="M35 70 L50 58 L70 66 L90 58 L105 70 L98 95 L98 140 L42 140 L42 95 Z"
          fill={jerseyColor}
          stroke="#00000022"
        />
        <circle cx="70" cy="95" r="10" fill="none" stroke={swatchTextColor(jersey)} strokeOpacity="0.4" strokeWidth="1.5" />
        {/* helmet */}
        <ellipse cx="70" cy="34" rx="26" ry="24" fill={helmetColor} stroke="#00000022" />
        <path d="M46 34 a24 22 0 0 1 48 0" fill="none" stroke="#00000022" />
        <ellipse cx="55" cy="36" rx="9" ry="11" fill="#00000014" />
        {logo ? (
          <text
            x="70"
            y="38"
            textAnchor="middle"
            fontSize="7"
            fontWeight="700"
            fill={swatchTextColor(helmet)}
          >
            {logo.length > 10 ? logo.slice(0, 9) + '…' : logo}
          </text>
        ) : null}
      </svg>
    </div>
  )
}
