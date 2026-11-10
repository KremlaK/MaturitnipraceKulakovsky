import { fmtKc, type CostSeries } from '../lib/carStatus';

// Náklady za 6 měsíců jako jednoduchá čára. Rozpracovaný měsíc je čárkovaně,
// aby nevypadal jako propad.
export default function CostChart({ series }: { series: CostSeries }) {
  const { months, average } = series;
  const max = Math.max(...months.map((m) => m.total), average ?? 0, 1);
  const x = (i: number) => 40 + i * 108;
  const y = (v: number) => 92 - (v / max) * 76;
  const done = months.slice(0, -1);
  const last = months.length - 1;
  return (
    <svg viewBox="0 0 600 126" fill="none" stroke="currentColor" className="w-full h-auto block mt-2.5 text-ink" role="img"
      aria-label={`Náklady po měsících: ${months.map((m) => `${m.label} ${fmtKc(m.total)}`).join(', ')}`}>
      {average != null && (
        <g className="text-ink-muted">
          <line x1={20} y1={y(average)} x2={580} y2={y(average)} strokeDasharray="3 5" strokeWidth={1} />
          <text x={580} y={y(average) - 6} textAnchor="end" stroke="none" fill="currentColor" className="font-mono-gauge" fontSize={13}>průměr</text>
        </g>
      )}
      <polyline points={done.map((m, i) => `${x(i)},${y(m.total)}`).join(' ')} strokeWidth={2} />
      <polyline points={`${x(last - 1)},${y(months[last - 1].total)} ${x(last)},${y(months[last].total)}`} strokeWidth={2} strokeDasharray="4 4" />
      {done.map((m, i) => <circle key={m.key} cx={x(i)} cy={y(m.total)} r={4} strokeWidth={1.6} className="fill-panel" />)}
      <circle cx={x(last)} cy={y(months[last].total)} r={5} stroke="none" className="fill-accent" />
      <g stroke="none" className="fill-ink-muted font-mono-gauge" fontSize={13}>
        {months.map((m, i) => (
          <text key={m.key} x={x(i)} y={120} textAnchor={i === last ? 'end' : 'middle'} dx={i === last ? 12 : 0}>{m.label}</text>
        ))}
      </g>
    </svg>
  );
}
