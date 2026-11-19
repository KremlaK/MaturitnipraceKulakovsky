import type { BodyType } from '../lib/carStatus';

// Auto zepředu (pohled do garážového stání). Zepředu se hatchback, sedan a kombi skoro
// neliší – rozdíl dělá hlavně výška střechy; SUV je vyšší a širší.
const DIMS: Record<BodyType, { roof: number; belt: number; bottom: number; half: number }> = {
  hatch: { roof: 34, belt: 74, bottom: 132, half: 78 },
  sedan: { roof: 38, belt: 76, bottom: 132, half: 80 },
  combi: { roof: 34, belt: 74, bottom: 132, half: 80 },
  suv: { roof: 20, belt: 66, bottom: 126, half: 84 },
};

export default function CarFront({ bodyType, className = '' }: { bodyType: BodyType; className?: string }) {
  const { roof, belt, bottom, half } = DIMS[bodyType];
  const cx = 100;
  const l = cx - half; // levý okraj karoserie
  const r = cx + half;
  const ground = 150;
  const glassL = cx - half * 0.58;
  const glassR = cx + half * 0.58;
  const topL = cx - half * 0.4;
  const topR = cx + half * 0.4;
  return (
    <svg viewBox="0 0 200 156" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" className={className} aria-hidden="true">
      {/* pneumatiky */}
      <rect x={l + 6} y={bottom - 6} width={26} height={ground - bottom + 6} rx={4} fill="currentColor" stroke="none" />
      <rect x={r - 32} y={bottom - 6} width={26} height={ground - bottom + 6} rx={4} fill="currentColor" stroke="none" />
      {/* karoserie */}
      <path
        d={`M${l + 2} ${belt + 8} Q${l + 4} ${belt} ${l + 20} ${belt - 2} L${r - 20} ${belt - 2} Q${r - 4} ${belt} ${r - 2} ${belt + 8} L${r + 2} ${bottom - 10} Q${r + 2} ${bottom} ${r - 8} ${bottom} L${l + 8} ${bottom} Q${l - 2} ${bottom} ${l - 2} ${bottom - 10} Z`}
        strokeWidth={2.2}
        className="fill-panel"
      />
      {/* kabina a čelní sklo */}
      <path d={`M${glassL - 6} ${belt - 2} L${topL - 4} ${roof} Q${cx} ${roof - 5} ${topR + 4} ${roof} L${glassR + 6} ${belt - 2}`} strokeWidth={2.2} className="fill-panel" />
      <path d={`M${glassL + 2} ${belt - 6} L${topL + 2} ${roof + 6} Q${cx} ${roof + 2} ${topR - 2} ${roof + 6} L${glassR - 2} ${belt - 6} Z`} strokeWidth={1.2} />
      {/* zrcátka */}
      <path d={`M${l + 14} ${belt - 3} L${l + 2} ${belt - 9} Q${l - 6} ${belt - 9} ${l - 6} ${belt - 3} L${l + 14} ${belt}`} strokeWidth={1.4} className="fill-panel" />
      <path d={`M${r - 14} ${belt - 3} L${r - 2} ${belt - 9} Q${r + 6} ${belt - 9} ${r + 6} ${belt - 3} L${r - 14} ${belt}`} strokeWidth={1.4} className="fill-panel" />
      {/* světla, maska, nárazník, SPZ */}
      <path d={`M${l + 8} ${belt + 14} L${l + 40} ${belt + 18} L${l + 38} ${belt + 27} L${l + 10} ${belt + 25} Z`} strokeWidth={1.3} />
      <path d={`M${r - 8} ${belt + 14} L${r - 40} ${belt + 18} L${r - 38} ${belt + 27} L${r - 10} ${belt + 25} Z`} strokeWidth={1.3} />
      <rect x={cx - 28} y={belt + 18} width={56} height={14} rx={4} strokeWidth={1.3} />
      <path d={`M${l + 4} ${bottom - 16} L${r - 4} ${bottom - 16}`} strokeWidth={0.9} />
      <rect x={cx - 20} y={bottom - 13} width={40} height={9} rx={1} strokeWidth={1.1} />
    </svg>
  );
}
