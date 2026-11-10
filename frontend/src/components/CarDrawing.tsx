import type { BodyType, StatusItem, StatusKey } from '../lib/carStatus';

// Bokorysy podle typu karoserie (předek vpravo). Souřadnice ve viewBoxu 1060 × 430,
// země na y = 375. Až budou výkresy z fotek, nahradí se jen tato data.
interface Shape {
  body: string;
  windows: string[];
  details: string[]; // spáry dveří, linie boku, práh
  parts: string[]; // zrcátko, kliky, světla
  flap: { x: number; y: number };
  plate: { x: number; y: number };
  wheels: [number, number];
  cy: number;
  r: number;
  anchors: Record<StatusKey, [number, number]>;
}

const SHAPES: Record<BodyType, Shape> = {
  combi: {
    body: 'M44 304 L32 262 L30 200 L38 150 Q46 112 82 98 L150 86 L520 76 Q585 74 640 86 Q700 112 762 158 L930 184 Q985 196 1004 222 L1012 268 L1006 296 Q998 305 980 306 L939.6 305 A90 90 0 0 0 760.4 305 L304.6 305 A90 90 0 0 0 125.4 305 Z',
    windows: [
      'M106 160 L116 120 Q122 104 142 102 L246 98 L246 162 Z',
      'M264 162 L264 97 L452 93 L452 164 Z',
      'M474 165 L474 92 L560 89 Q610 90 636 104 L712 162 L704 168 Z',
    ],
    details: ['M256 166 L260 232 Q266 268 302 292', 'M463 168 L466 302', 'M716 172 L722 232 Q730 266 760 288', 'M120 204 L900 216', 'M300 296 L762 298'],
    parts: ['M700 152 L726 146 L732 164 L705 168 Z', 'M298 192 L330 192 M512 194 L544 194', 'M960 196 L1001 214 L996 228 L957 214 Z', 'M33 158 L52 160 L52 196 L32 194'],
    flap: { x: 150, y: 178 },
    plate: { x: 30, y: 226 },
    wheels: [215, 850], cy: 297, r: 78,
    anchors: { oil: [880, 200], fuel: [164, 190], tires: [155, 345], brakes: [850, 297], stk: [34, 237] },
  },
  hatch: {
    body: 'M66 300 L52 258 L54 196 Q62 140 96 112 L168 90 L500 82 Q570 82 618 96 Q690 128 752 168 L922 192 Q974 204 992 228 L998 270 L990 296 Q982 306 966 306 L917.7 306 A88 88 0 0 0 742.3 306 L327.7 306 A88 88 0 0 0 152.3 306 Z',
    windows: [
      'M118 166 L128 128 Q136 112 164 108 L232 105 L232 166 Z',
      'M250 168 L250 102 L455 96 L455 170 Z',
      'M476 171 L476 95 L560 92 Q605 94 628 108 L700 166 L692 172 Z',
    ],
    details: ['M242 172 L246 232 Q252 262 300 280', 'M466 174 L469 302', 'M708 176 L714 232 Q722 262 744 280', 'M120 208 L880 220', 'M330 298 L742 300'],
    parts: ['M690 156 L716 150 L722 168 L695 172 Z', 'M290 196 L320 196 M510 198 L540 198', 'M944 202 L984 220 L980 232 L942 220 Z', 'M56 186 L76 188 L76 222 L55 220'],
    flap: { x: 168, y: 186 },
    plate: { x: 54, y: 232 },
    wheels: [240, 830], cy: 299, r: 76,
    anchors: { oil: [870, 206], fuel: [181, 197], tires: [182, 349], brakes: [830, 299], stk: [58, 243] },
  },
  sedan: {
    body: 'M58 302 L44 262 L44 214 Q46 196 70 190 L200 180 Q240 132 300 100 L330 92 L560 86 Q615 88 650 104 Q706 132 760 168 L930 192 Q982 204 998 230 L1004 270 L996 298 Q988 306 972 306 L939.6 305 A90 90 0 0 0 760.4 305 L304.6 305 A90 90 0 0 0 125.4 305 Z',
    windows: [
      'M264 172 Q280 136 312 110 L330 104 L452 100 L452 172 Z',
      'M474 173 L474 99 L566 96 Q614 98 642 114 L712 166 L704 172 Z',
    ],
    details: ['M256 176 L262 236 Q268 268 302 292', 'M463 176 L466 302', 'M716 176 L722 232 Q730 266 760 288', 'M60 212 L900 222', 'M300 296 L762 298', 'M72 192 L196 184'],
    parts: ['M700 156 L726 150 L732 168 L705 172 Z', 'M300 198 L332 198 M512 200 L544 200', 'M956 202 L996 220 L991 234 L953 220 Z', 'M45 216 L68 214 L68 240 L45 242'],
    flap: { x: 82, y: 222 },
    plate: { x: 42, y: 246 },
    wheels: [215, 850], cy: 297, r: 78,
    anchors: { oil: [880, 206], fuel: [96, 234], tires: [155, 345], brakes: [850, 297], stk: [46, 257] },
  },
  suv: {
    body: 'M40 300 L30 250 L32 170 Q38 112 70 92 L150 74 L540 66 Q600 66 640 78 Q705 108 765 150 L940 172 Q996 184 1010 214 L1014 262 L1006 292 Q998 301 982 301 L944.6 300 A95 95 0 0 0 755.4 300 L319.6 300 A95 95 0 0 0 130.4 300 Z',
    windows: [
      'M104 150 L114 108 Q122 92 146 90 L240 86 L240 150 Z',
      'M258 150 L258 85 L452 80 L452 152 Z',
      'M474 153 L474 79 L560 76 Q612 78 640 94 L716 148 L706 154 Z',
    ],
    details: ['M250 156 L254 222 Q262 252 300 262', 'M463 156 L466 296', 'M720 160 L726 222 Q734 250 760 262', 'M110 196 L905 206', 'M320 290 L755 292', 'M150 66 L540 58'],
    parts: ['M702 140 L730 134 L736 154 L707 158 Z', 'M296 182 L330 182 M512 184 L546 184', 'M962 186 L1006 204 L1002 218 L960 204 Z', 'M32 150 L54 152 L54 192 L31 190'],
    flap: { x: 150, y: 168 },
    plate: { x: 30, y: 214 },
    wheels: [225, 850], cy: 291, r: 84,
    anchors: { oil: [885, 190], fuel: [164, 179], tires: [165, 348], brakes: [850, 291], stk: [34, 225] },
  },
};

// kam se vynese kroužek s číslem vzhledem ke kotvě
const MARKER_OFFSET: Record<StatusKey, [number, 'top' | 'bottom']> = {
  oil: [40, 'top'],
  fuel: [-44, 'top'],
  tires: [-70, 'bottom'],
  brakes: [120, 'bottom'],
  stk: [-4, 'top'],
};

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rim = r * 0.69;
  const hub = r * 0.115;
  const spokes = [0, 72, 144, 216, 288].map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `M${cx + hub * Math.cos(a)} ${cy + hub * Math.sin(a)} L${cx + rim * 0.98 * Math.cos(a)} ${cy + rim * 0.98 * Math.sin(a)}`;
  });
  return (
    <g strokeWidth={1.3}>
      <circle cx={cx} cy={cy} r={r} strokeWidth={2.4} />
      <circle cx={cx} cy={cy} r={rim} />
      <circle cx={cx} cy={cy} r={hub} />
      <path d={spokes.join(' ')} />
    </g>
  );
}

interface Props {
  bodyType: BodyType;
  items: StatusItem[];
  label: string;
}

const MIN_GAP = 38; // kroužky na stejné řadě se nesmí překrývat (průměr 30)

/** Rozmístí kroužky: výchozí pozice podle kotvy, pak odsune sousedy na stejné řadě. */
function placeMarkers(items: StatusItem[], shape: Shape) {
  const placed = items.map((item) => {
    const [ax, ay] = shape.anchors[item.key];
    const [dx, pos] = MARKER_OFFSET[item.key];
    return { item, ax, ay, pos, mx: Math.min(1025, Math.max(15, ax + dx)) };
  });
  for (const row of ['top', 'bottom'] as const) {
    const inRow = placed.filter((p) => p.pos === row).sort((a, b) => a.mx - b.mx);
    for (let i = 1; i < inRow.length; i++) {
      if (inRow[i].mx - inRow[i - 1].mx < MIN_GAP) inRow[i].mx = inRow[i - 1].mx + MIN_GAP;
    }
  }
  return placed;
}

export default function CarDrawing({ bodyType, items, label }: Props) {
  const s = SHAPES[bodyType];
  const [rx, fx] = s.wheels;
  return (
    <svg
      viewBox="-10 30 1060 430"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      className="w-full h-auto block text-ink"
    >
      <g>
        <path d={s.body} strokeWidth={2.4} />
        {s.windows.map((d) => <path key={d} d={d} strokeWidth={1.3} />)}
        {s.details.map((d) => <path key={d} d={d} strokeWidth={0.9} className="text-ink-muted" />)}
        {s.parts.map((d) => <path key={d} d={d} strokeWidth={1.3} />)}
        <rect x={s.flap.x} y={s.flap.y} width={28} height={24} rx={6} strokeWidth={1.3} />
        <Wheel cx={rx} cy={s.cy} r={s.r} />
        <Wheel cx={fx} cy={s.cy} r={s.r} />
        <line x1={0} y1={375} x2={1040} y2={375} strokeWidth={0.9} strokeDasharray="2 6" className="text-ink-muted" />
      </g>
      <g strokeWidth={1} className="text-ink-muted">
        <line x1={rx} y1={398} x2={fx} y2={398} />
        <line x1={rx} y1={388} x2={rx} y2={408} />
        <line x1={fx} y1={388} x2={fx} y2={408} />
        <text x={(rx + fx) / 2} y={420} textAnchor="middle" stroke="none" fill="currentColor" className="font-mono-gauge" fontSize={11} letterSpacing={1.3}>
          ROZVOR
        </text>
      </g>
      {placeMarkers(items, s).map(({ item, ax, ay, pos, mx }) => {
        const my = pos === 'top' ? 58 : 446;
        const ly = pos === 'top' ? my + 14 : my - 14;
        return (
          <g key={item.key} className={item.warn ? 'text-accent' : 'text-ink'}>
            <path d={`M${ax} ${ay} L${mx} ${ly}`} strokeWidth={1} />
            {item.key === 'stk' ? (
              <rect x={s.plate.x} y={s.plate.y} width={8} height={22} rx={1} strokeWidth={1.4} />
            ) : (
              <circle cx={ax} cy={ay} r={4} fill="currentColor" stroke="none" />
            )}
            <circle cx={mx} cy={my} r={15} strokeWidth={1.4} className={item.warn ? 'fill-accent' : 'fill-panel'} />
            <text
              x={mx}
              y={my + 5}
              textAnchor="middle"
              stroke="none"
              className={`font-mono-gauge ${item.warn ? 'fill-on-accent' : 'fill-ink'}`}
              fontSize={15}
              fontWeight={600}
            >
              {item.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
