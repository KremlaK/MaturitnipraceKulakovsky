import { useId } from 'react';
import type { BodyType } from '../lib/carStatus';

// Auto zepředu pro garáž (když uživatel nemá vlastní fotku). Stínovaná ilustrace:
// stříbrný lak s odleskem, tmavé čelní sklo, světla, maska, SPZ. Zepředu se hatchback,
// sedan a kombi skoro neliší – rozdíl je hlavně ve výšce střechy; SUV je vyšší a širší.
const DIMS: Record<BodyType, { roof: number; belt: number; bottom: number; half: number }> = {
  hatch: { roof: 34, belt: 74, bottom: 134, half: 78 },
  sedan: { roof: 38, belt: 76, bottom: 134, half: 80 },
  combi: { roof: 34, belt: 74, bottom: 134, half: 80 },
  suv: { roof: 20, belt: 66, bottom: 128, half: 84 },
};

export default function CarFront({ bodyType, className = '' }: { bodyType: BodyType; className?: string }) {
  const id = useId().replace(/:/g, '');
  const { roof, belt, bottom, half } = DIMS[bodyType];
  const cx = 100;
  const l = cx - half;
  const r = cx + half;
  const ground = 152;
  const glassL = cx - half * 0.6;
  const glassR = cx + half * 0.6;
  const topL = cx - half * 0.4;
  const topR = cx + half * 0.4;
  const g = (name: string) => `url(#${id}-${name})`;

  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9ecef" />
          <stop offset="0.45" stopColor="#c3c8ce" />
          <stop offset="1" stopColor="#7d848c" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.18" stopColor="#000" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d242c" />
          <stop offset="1" stopColor="#4a5866" />
        </linearGradient>
        <linearGradient id={`${id}-lamp`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#b9c7d6" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* stín na podlaze */}
      <ellipse cx={cx} cy={ground - 1} rx={half + 18} ry={9} fill={g('shadow')} />

      {/* pneumatiky */}
      <rect x={l + 6} y={bottom - 8} width={28} height={ground - bottom + 8} rx={5} fill="#16181b" />
      <rect x={r - 34} y={bottom - 8} width={28} height={ground - bottom + 8} rx={5} fill="#16181b" />

      {/* zrcátka */}
      <path d={`M${l + 14} ${belt - 3} L${l + 1} ${belt - 10} Q${l - 7} ${belt - 10} ${l - 7} ${belt - 3} L${l + 14} ${belt + 1} Z`} fill={g('paint')} stroke="#5f666d" strokeWidth="0.8" />
      <path d={`M${r - 14} ${belt - 3} L${r - 1} ${belt - 10} Q${r + 7} ${belt - 10} ${r + 7} ${belt - 3} L${r - 14} ${belt + 1} Z`} fill={g('paint')} stroke="#5f666d" strokeWidth="0.8" />

      {/* kabina: střecha a sloupky */}
      <path d={`M${glassL - 7} ${belt} L${topL - 5} ${roof} Q${cx} ${roof - 6} ${topR + 5} ${roof} L${glassR + 7} ${belt} Z`} fill={g('paint')} stroke="#5f666d" strokeWidth="0.8" />
      {/* čelní sklo s odleskem */}
      <path d={`M${glassL + 1} ${belt - 4} L${topL + 2} ${roof + 6} Q${cx} ${roof + 2} ${topR - 2} ${roof + 6} L${glassR - 1} ${belt - 4} Z`} fill={g('glass')} />
      <path d={`M${topL + 10} ${roof + 7} L${topL + 22} ${roof + 6} L${glassL + 24} ${belt - 5} L${glassL + 12} ${belt - 5} Z`} fill="#fff" opacity="0.12" />

      {/* karoserie */}
      <path
        d={`M${l + 2} ${belt + 8} Q${l + 4} ${belt} ${l + 20} ${belt - 2} L${r - 20} ${belt - 2} Q${r - 4} ${belt} ${r - 2} ${belt + 8} L${r + 2} ${bottom - 10} Q${r + 2} ${bottom} ${r - 8} ${bottom} L${l + 8} ${bottom} Q${l - 2} ${bottom} ${l - 2} ${bottom - 10} Z`}
        fill={g('paint')}
        stroke="#5f666d"
        strokeWidth="0.8"
      />
      <path
        d={`M${l + 2} ${belt + 8} Q${l + 4} ${belt} ${l + 20} ${belt - 2} L${r - 20} ${belt - 2} Q${r - 4} ${belt} ${r - 2} ${belt + 8} L${r + 2} ${bottom - 10} Q${r + 2} ${bottom} ${r - 8} ${bottom} L${l + 8} ${bottom} Q${l - 2} ${bottom} ${l - 2} ${bottom - 10} Z`}
        fill={g('side')}
      />
      {/* odlesk na kapotě */}
      <path d={`M${l + 24} ${belt + 2} L${r - 24} ${belt + 2}`} stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" />

      {/* světlomety */}
      <path d={`M${l + 8} ${belt + 13} L${l + 42} ${belt + 18} L${l + 40} ${belt + 28} L${l + 10} ${belt + 25} Z`} fill={g('lamp')} stroke="#4c535a" strokeWidth="0.9" />
      <path d={`M${r - 8} ${belt + 13} L${r - 42} ${belt + 18} L${r - 40} ${belt + 28} L${r - 10} ${belt + 25} Z`} fill={g('lamp')} stroke="#4c535a" strokeWidth="0.9" />

      {/* maska chladiče */}
      <rect x={cx - 30} y={belt + 17} width={60} height={15} rx={4} fill="#202429" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={cx - 26} y1={belt + 21 + i * 4} x2={cx + 26} y2={belt + 21 + i * 4} stroke="#4a5058" strokeWidth="0.9" />
      ))}

      {/* nárazník a spodní mřížka */}
      <path d={`M${l + 4} ${bottom - 18} L${r - 4} ${bottom - 18}`} stroke="#5f666d" strokeWidth="0.8" />
      <rect x={cx - 36} y={bottom - 10} width={72} height={6} rx={3} fill="#2a2e33" />

      {/* SPZ */}
      <rect x={cx - 21} y={bottom - 17} width={42} height={10} rx={1} fill="#fff" stroke="#222" strokeWidth="0.8" />
      <rect x={cx - 21} y={bottom - 17} width={5} height={10} fill="#1f4fbf" />
    </svg>
  );
}
