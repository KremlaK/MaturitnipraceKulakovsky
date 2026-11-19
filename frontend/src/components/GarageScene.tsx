import { useId } from 'react';
import { Link } from 'react-router-dom';
import type { Car } from '../api/cars';
import { drawingBodyType } from '../lib/carStatus';
import CarFront from './CarFront';
import Icon from './Icon';

// Ilustrovaná garáž v jednobodové perspektivě (pohled otevřenými vraty dovnitř).
// Scéna je SVG 1200 × 600; auta a tlačítka leží nad ní jako HTML (klikací a čitelná).
const VW = 1200;
const VH = 600;
const BACK = { l: 230, r: 970, top: 90, floor: 340 }; // zadní stěna
const BAYS = 4;
const CAR_DEPTH = 0.8; // jak hluboko ve stání auto stojí (0 = u zadní stěny, 1 = u vrat)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const floorY = (t: number) => lerp(BACK.floor, VH, t);
/** x hranice stání i (0–4) v hloubce t */
const bayX = (i: number, t: number) => lerp(BACK.l + (i * (BACK.r - BACK.l)) / BAYS, (i * VW) / BAYS, t);
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export interface SceneBay {
  car: Car | null;
  warn: boolean;
  label: string; // pro kontrolku: „v pořádku“ / „2 termíny“
}

interface Props {
  floor: number;
  bays: SceneBay[]; // vždy 4 položky (prázdné stání = car null)
  onAdd: () => void;
}

function CarInBay({ car }: { car: Car }) {
  const cutout = car.photoCutoutUrl && car.photoView !== 'SIDE' ? car.photoCutoutUrl : null;
  if (cutout) {
    return (
      <span className="relative block w-full h-full">
        {/* stín pod vystřiženým autem */}
        <span className="absolute left-[4%] right-[4%] bottom-[-3%] h-[9%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.55),transparent)]" />
        <img src={cutout} alt="" className="relative w-full h-full object-contain object-bottom" draggable={false} />
      </span>
    );
  }
  return <CarFront bodyType={drawingBodyType(car)} className="w-full h-full" />;
}

export default function GarageScene({ floor, bays, onAdd }: Props) {
  const id = useId().replace(/:/g, '');
  const u = (name: string) => `url(#${id}-${name})`;
  const firstEmpty = bays.findIndex((b) => !b.car);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VW} / ${VH}` }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--g-floor-far)" />
            <stop offset="1" stopColor="var(--g-floor-near)" />
          </linearGradient>
          <linearGradient id={`${id}-ceiling`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--g-ceiling)" />
            <stop offset="1" stopColor="var(--g-wall)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`${id}-wallL`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--g-side)" />
            <stop offset="1" stopColor="var(--g-wall)" />
          </linearGradient>
          <linearGradient id={`${id}-wallR`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="var(--g-side)" />
            <stop offset="1" stopColor="var(--g-wall)" />
          </linearGradient>
          <radialGradient id={`${id}-pool`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--g-light)" stopOpacity="var(--g-pool)" />
            <stop offset="1" stopColor="var(--g-light)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--g-light)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--g-light)" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${id}-hazard`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="14" fill="var(--g-paint)" />
            <rect x="7" width="7" height="14" fill="#1d1f22" />
          </pattern>
          {/* jemná textura betonu */}
          <filter id={`${id}-concrete`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        {/* strop, stěny, podlaha */}
        <polygon points={`0,0 ${VW},0 ${BACK.r},${BACK.top} ${BACK.l},${BACK.top}`} fill={u('ceiling')} />
        <polygon points={`0,0 ${BACK.l},${BACK.top} ${BACK.l},${BACK.floor} 0,${VH}`} fill={u('wallL')} />
        <polygon points={`${VW},0 ${BACK.r},${BACK.top} ${BACK.r},${BACK.floor} ${VW},${VH}`} fill={u('wallR')} />
        <rect x={BACK.l} y={BACK.top} width={BACK.r - BACK.l} height={BACK.floor - BACK.top} fill="var(--g-wall)" />
        <polygon points={`${BACK.l},${BACK.floor} ${BACK.r},${BACK.floor} ${VW},${VH} 0,${VH}`} fill={u('floor')} />
        <rect width={VW} height={VH} fill="#000" filter={u('concrete')} />

        {/* hrany místnosti */}
        <g stroke="var(--g-edge)" strokeWidth="1.5" fill="none">
          <path d={`M0,0 L${BACK.l},${BACK.top} L${BACK.r},${BACK.top} L${VW},0`} />
          <path d={`M0,${VH} L${BACK.l},${BACK.floor} L${BACK.r},${BACK.floor} L${VW},${VH}`} />
          <path d={`M${BACK.l},${BACK.top} V${BACK.floor} M${BACK.r},${BACK.top} V${BACK.floor}`} />
        </g>

        {/* označení patra na zadní stěně */}
        {/* cedule visí mezi prvním a druhým sloupem, pod naváděcími kontrolkami */}
        <g transform={`translate(${(bayX(1, 0) + bayX(2, 0)) / 2} ${BACK.top + 52})`}>
          <rect x="-62" y="0" width="124" height="34" rx="3" fill="#1f4fbf" stroke="#173c91" />
          <rect x="-54" y="7" width="20" height="20" rx="2" fill="#fff" />
          <text x="-44" y="23" textAnchor="middle" fill="#1f4fbf" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fontSize="18">P</text>
          <text x="14" y="24" textAnchor="middle" fill="#fff" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fontSize="19" letterSpacing="1.5">
            PATRO {floor}
          </text>
        </g>

        {/* sloupy mezi stáními (u zadní stěny) s výstražným pruhem */}
        {[1, 2, 3].map((i) => {
          const x = bayX(i, 0);
          return (
            <g key={i}>
              <rect x={x - 11} y={BACK.top} width="22" height={BACK.floor - BACK.top} fill="var(--g-column)" stroke="var(--g-edge)" strokeWidth="1" />
              <rect x={x - 11} y={BACK.floor - 46} width="22" height="46" fill={u('hazard')} />
            </g>
          );
        })}

        {/* zářivky u stropu a světlo, které dopadá na podlahu */}
        {Array.from({ length: BAYS }, (_, i) => {
          const t = 0.45;
          const y = lerp(0, BACK.top, 1 - t);
          const x1 = lerp(bayX(i, 0) + 40, (i * VW) / BAYS + 70, t);
          const x2 = lerp(bayX(i + 1, 0) - 40, ((i + 1) * VW) / BAYS - 70, t);
          const cx = (bayX(i, CAR_DEPTH) + bayX(i + 1, CAR_DEPTH)) / 2;
          return (
            <g key={i}>
              <ellipse cx={(x1 + x2) / 2} cy={y + 4} rx={(x2 - x1) / 1.4} ry="16" fill={u('glow')} />
              <rect x={x1} y={y} width={x2 - x1} height="7" rx="3" fill="var(--g-light)" stroke="var(--g-edge)" strokeWidth="0.8" />
              <ellipse cx={cx} cy={floorY(CAR_DEPTH) - 20} rx="190" ry="60" fill={u('pool')} />
            </g>
          );
        })}

        {/* namalovaná stání: čáry a čísla */}
        <g stroke="var(--g-line)" strokeLinecap="round" opacity="0.9">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={bayX(i, 0.02)} y1={floorY(0.02)} x2={bayX(i, 1)} y2={VH} strokeWidth={i === 0 || i === BAYS ? 3 : 5} />
          ))}
          {/* zarážka u zadní stěny */}
          <line x1={BACK.l + 8} y1={floorY(0.06)} x2={BACK.r - 8} y2={floorY(0.06)} strokeWidth="3" />
        </g>
        {Array.from({ length: BAYS }, (_, i) => {
          const t = 0.94;
          const cx = (bayX(i, t) + bayX(i + 1, t)) / 2;
          return (
            <text key={i} x={cx} y={floorY(t)} textAnchor="middle" fill="var(--g-line)" opacity="0.85"
              fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fontSize="44"
              transform={`translate(0 ${floorY(t)}) scale(1 0.42) translate(0 ${-floorY(t)})`}>
              P{i + 1}
            </text>
          );
        })}

        {/* naváděcí kontrolky nad stáními (jako v parkovacích domech) */}
        {bays.map((b, i) => {
          const cx = (bayX(i, 0) + bayX(i + 1, 0)) / 2;
          const color = !b.car ? '#6b7178' : b.warn ? '#ff7a2f' : '#3fbf6f';
          return (
            <g key={i}>
              <rect x={cx - 3} y={BACK.top - 14} width="6" height="14" fill="var(--g-edge)" />
              {b.car && <circle cx={cx} cy={BACK.top + 8} r="22" fill={color} opacity="0.25" />}
              <circle cx={cx} cy={BACK.top + 8} r="9" fill={color} stroke="#1d1f22" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* vytažená rolovací vrata u stropu a vodicí lišty po stranách */}
        <rect x="0" y="0" width={VW} height="30" fill="var(--g-column)" />
        {[6, 12, 18, 24].map((y) => <line key={y} x1="0" y1={y} x2={VW} y2={y} stroke="var(--g-edge)" strokeWidth="1" />)}
        <rect x="0" y="30" width={VW} height="6" fill="#1d1f22" opacity="0.5" />
        <rect x="0" y="0" width="14" height={VH} fill="var(--g-column)" stroke="var(--g-edge)" />
        <rect x={VW - 14} y="0" width="14" height={VH} fill="var(--g-column)" stroke="var(--g-edge)" />
      </svg>

      {/* auta a volná stání jako klikací prvky nad scénou */}
      {bays.map((b, i) => {
        const left = bayX(i, CAR_DEPTH);
        const right = bayX(i + 1, CAR_DEPTH);
        const w = (right - left) * 0.8;
        const h = w * 0.8;
        const x = (left + right) / 2 - w / 2;
        const y = floorY(CAR_DEPTH) - h;
        const style = { left: pct(x, VW), top: pct(y, VH), width: pct(w, VW), height: pct(h, VH) };
        if (b.car) {
          return (
            <Link key={b.car.id} to={`/cars/${b.car.id}`} className="garage-car absolute block rounded" style={style}
              aria-label={`${b.car.make} ${b.car.model}, stání P${i + 1}, ${b.label}`}>
              <CarInBay car={b.car} />
            </Link>
          );
        }
        if (i === firstEmpty) {
          return (
            <button key={`free-${i}`} onClick={onAdd} style={style}
              className="absolute rounded-lg border-2 border-dashed border-[var(--g-line)] text-[var(--g-line)] bg-black/10 hover:bg-black/20 flex flex-col items-center justify-center gap-1">
              <Icon name="plus" size={26} strokeWidth={2.2} />
              <span className="label-caps text-xs sm:text-sm hidden sm:block">Zaparkovat auto</span>
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}
