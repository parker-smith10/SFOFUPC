import { swatchColor, swatchTextColor } from '../lib/colorMap'

export default function UniformPreview({ helmet, jersey, pants, logo, size = 'md' }) {
  const helmetColor = swatchColor(helmet)
  const jerseyColor = swatchColor(jersey)
  const pantsColor = swatchColor(pants)
  const helmetDetail = swatchTextColor(helmet)
  const jerseyDetail = swatchTextColor(jersey)
  const pantsDetail = swatchTextColor(pants)
  const facemask = '#8a8a8a'

  const dims = size === 'sm' ? { w: 96, h: 144 } : { w: 150, h: 225 }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 160 240"
        width={dims.w}
        height={dims.h}
        role="img"
        aria-label={`Helmet: ${helmet || '?'}, Jersey: ${jersey || '?'}, Pants: ${pants || '?'}, Logo: ${logo || '?'}`}
      >
        {/* ---------- Pants ---------- */}
        <path
          d="M56 168 L104 168 L104 226 Q104 232 98 232 L88 232 Q82 232 82 226 L82 196 L78 196 L78 226 Q78 232 72 232 L62 232 Q56 232 56 226 Z"
          fill={pantsColor}
          stroke="#00000022"
        />
        {/* leg side stripes */}
        <rect x="57" y="170" width="3" height="58" fill={pantsDetail} opacity="0.5" />
        <rect x="100" y="170" width="3" height="58" fill={pantsDetail} opacity="0.5" />
        {/* knee pads */}
        <ellipse cx="67" cy="210" rx="7" ry="9" fill={pantsDetail} opacity="0.14" />
        <ellipse cx="93" cy="210" rx="7" ry="9" fill={pantsDetail} opacity="0.14" />

        {/* ---------- Jersey ---------- */}
        <path
          d="M60 104
             L100 104
             L118 116 L110 134 L104 128 L104 172 L56 172 L56 128 L50 134 L42 116 Z"
          fill={jerseyColor}
          stroke="#00000022"
          strokeWidth="1.2"
        />
        {/* collar */}
        <path d="M70 104 Q80 116 90 104" fill="none" stroke={jerseyDetail} strokeOpacity="0.55" strokeWidth="2.5" />
        {/* sleeve stripes */}
        <path d="M46 118 L52 121" stroke={jerseyDetail} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        <path d="M114 118 L108 121" stroke={jerseyDetail} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        {/* number */}
        <text
          x="80"
          y="150"
          textAnchor="middle"
          fontFamily="'Barlow Semi Condensed', sans-serif"
          fontSize="26"
          fontWeight="800"
          fill={jerseyDetail}
          opacity="0.85"
        >
          10
        </text>

        {/* ---------- Helmet (side profile, facing left) ---------- */}
        {/* shell */}
        <path
          d="M96 15
             C64 11 36 27 32 55
             C31 64 33 72 40 79
             C45 84 53 83 57 76
             C60 71 62 66 68 64
             C77 62 85 68 89 77
             C92 83 99 85 105 83
             C122 78 130 62 127 45
             C124 29 114 18 96 15 Z"
          fill={helmetColor}
          stroke="#00000033"
          strokeWidth="1.6"
        />
        {/* crown highlight */}
        <path d="M52 25 C43 33 39 44 40 55" fill="none" stroke={helmetDetail} strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
        {/* ear hole */}
        <circle cx="86" cy="58" r="6.5" fill="#00000033" />
        <circle cx="86" cy="58" r="2.5" fill={helmetColor} />
        {/* chin strap */}
        <path d="M52 88 C60 100 82 100 90 87" fill="none" stroke="#00000033" strokeWidth="2.4" strokeLinecap="round" />
        {/* facemask cage */}
        <g fill="none" stroke={facemask} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M58 74 C34 76 24 84 28 95 L88 95 C94 90 92 80 84 76" />
          <path d="M30 88 L86 88" />
          <path d="M45 79 L43 95" />
          <path d="M61 78 L61 95" />
          <path d="M76 80 L76 95" />
        </g>
      </svg>

      {logo ? (
        <div
          className={`max-w-[150px] text-center font-semibold leading-tight text-osu-black/75 ${
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          }`}
        >
          {logo}
        </div>
      ) : null}
    </div>
  )
}
