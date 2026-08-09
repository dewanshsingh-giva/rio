import type { CSSProperties } from 'react';
import { useId } from 'react';

/** Shared RIO brand tokens — green-forward identity with ink neutrals. */
export const RIO_BRAND = {
  ink: '#1D1B18',
  inkSoft: '#3a3630',
  green: '#146B4B',
  greenDeep: '#0B4D3E',
  greenMid: '#0F766E',
  greenLight: '#2DD4A8',
  greenGlow: '#5EEAD4',
  greenSoft: '#E7F3EC',
  cream: '#FFF5F0',
  gold: '#B4780C',
} as const;

type Variant = 'light' | 'dark';

/** Equalizer bars — center peaks tallest; scales cleanly at favicon size. */
const BARS = [
  { x: 10.5, w: 3.5, h: 10 },
  { x: 15.5, w: 3.5, h: 15 },
  { x: 20.5, w: 3.5, h: 22 },
  { x: 25.5, w: 3.5, h: 13 },
] as const;
const BAR_BASE = 32;
const TILE_R = 10;

export function RioLogoMark({
  size = 34,
  variant = 'light',
  className = '',
}: {
  size?: number;
  variant?: Variant;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const bgId = `rio-bg-${uid}`;

  const isDark = variant === 'dark';
  const bgStops = isDark
    ? [
        { offset: '0%', color: RIO_BRAND.greenMid },
        { offset: '100%', color: RIO_BRAND.green },
      ]
    : [
        { offset: '0%', color: RIO_BRAND.greenDeep },
        { offset: '50%', color: RIO_BRAND.green },
        { offset: '100%', color: RIO_BRAND.greenMid },
      ];

  const barFill = '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={bgId} x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          {bgStops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx={TILE_R} fill={`url(#${bgId})`} />

      {BARS.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={BAR_BASE - bar.h}
          width={bar.w}
          height={bar.h}
          rx={1.75}
          fill={barFill}
          opacity={i === 2 ? 1 : i === 1 || i === 3 ? 0.92 : 0.82}
        />
      ))}
    </svg>
  );
}

export default function RioLogo({
  size = 34,
  variant = 'light',
  showWordmark = true,
  subtitle,
  className = '',
}: {
  size?: number;
  variant?: Variant;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}) {
  const titleColor = variant === 'light' ? 'text-ink' : 'text-white';
  const subColor = variant === 'light' ? 'text-muted' : 'text-stone-400';

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <RioLogoMark size={size} variant={variant} />
      {showWordmark && (
        <span className="min-w-0">
          <b className={`block text-sm tracking-tight leading-tight ${titleColor}`}>
            Retail Intelligence <span className={variant === 'light' ? 'text-good' : 'text-emerald-300'}>OS</span>
          </b>
          {subtitle !== undefined ? (
            <small className={`block text-[11px] leading-snug ${subColor}`}>{subtitle}</small>
          ) : (
            <small className={`block text-[11px] ${subColor}`}>
              <span className="font-semibold text-good">RIO</span>
              <span className="opacity-70"> · Big Ears</span>
            </small>
          )}
        </span>
      )}
    </div>
  );
}

export const rioGreenGradientStyle: CSSProperties = {
  background: `linear-gradient(135deg, ${RIO_BRAND.green}, ${RIO_BRAND.greenMid})`,
};
