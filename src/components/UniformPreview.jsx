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
          fontFamily="'Inter', sans-serif"
          fontSize="26"
          fontWeight="800"
          fill={jerseyDetail}
          opacity="0.85"
        >
          10
        </text>

        {/* ---------- Helmet ---------- */}
        {/* shell */}
        <path
          d="M80 12
             C112 12 126 34 126 56
             C126 74 116 86 104 90
             L96 90
             C98 78 96 66 84 62
             L52 62
             C46 50 44 30 62 18
             C68 14 74 12 80 12 Z"
          fill={helmetColor}
          stroke="#00000022"
          strokeWidth="1.2"
        />
        {/* dome highlight */}
        <path d="M66 22 Q80 16 98 24" fill="none" stroke={helmetDetail} strokeOpacity="0.18" strokeWidth="5" strokeLinecap="round" />
        {/* center stripe */}
        <path d="M80 12 C72 26 72 44 78 60" fill="none" stroke={helmetDetail} strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
        {/* ear hole */}
        <circle cx="92" cy="66" r="6" fill="#00000022" />
        {/* facemask */}
        <g fill="none" stroke={facemask} strokeWidth="2.6" strokeLinecap="round">
          <path d="M52 62 C40 64 34 74 40 86 L104 86 C112 82 106 66 96 66" />
          <path d="M46 74 L102 74" />
          <path d="M50 82 L98 82" />
          <path d="M70 64 L70 86" />
          <path d="M86 64 L86 86" />
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
