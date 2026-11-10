import { fmtInt, type RulerData } from '../lib/carStatus';

// Kilometrovník: vodorovná osa v km – proběhlé záznamy, „teď“ a plánované připomínky.
export default function OdometerRuler({ data }: { data: RulerData }) {
  const { start, end, step, labelEvery, now, past, future } = data;
  const x = (km: number) => 10 + ((km - start) / (end - start)) * 580;
  const ticks: { km: number; major: boolean; label: boolean }[] = [];
  for (let km = start, i = 0; km <= end; km += step, i++) {
    ticks.push({ km, major: i % labelEvery === 0, label: i % (labelEvery * 2) === 0 || km === end });
  }
  const nextWarn = future.find((f) => f.warn);
  return (
    <svg viewBox="0 0 600 96" fill="none" stroke="currentColor" strokeLinecap="round" className="w-full h-auto block text-ink" role="img"
      aria-label={`Kilometrovník: teď ${fmtInt(now)} km${future.length ? `, další plán: ${future.map((f) => `${f.label} při ${fmtInt(f.km)} km`).join(', ')}` : ''}`}>
      <line x1={10} y1={52} x2={590} y2={52} strokeWidth={1.5} />
      <g strokeWidth={1} className="text-ink-muted">
        {ticks.map((t) => (
          <line key={t.km} x1={x(t.km)} y1={52} x2={x(t.km)} y2={52 - (t.major ? 14 : 7)} />
        ))}
      </g>
      <g stroke="none" className="fill-ink-muted font-mono-gauge" fontSize={13}>
        {ticks.filter((t) => t.label).map((t, i, arr) => (
          <text key={t.km} x={x(t.km)} y={84} textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}>
            {fmtInt(t.km)}
          </text>
        ))}
      </g>
      <g stroke="none" fill="currentColor">
        {past.map((km) => <circle key={km} cx={x(km)} cy={52} r={3.5} />)}
      </g>
      {nextWarn && <line x1={x(now)} y1={52} x2={x(nextWarn.km)} y2={52} strokeWidth={3} className="text-accent" />}
      <rect x={x(now) - 4} y={40} width={8} height={24} fill="currentColor" stroke="none" />
      <text x={x(now)} y={30} textAnchor="middle" stroke="none" fill="currentColor" className="font-display" fontWeight={600} fontSize={16} letterSpacing={1.2}>
        TEĎ
      </text>
      {future.map((f) => (
        <g key={`${f.label}-${f.km}`} className={f.warn ? 'text-accent' : 'text-ink'} stroke="none" fill="currentColor">
          <path d={`M${x(f.km)} 40 l8 12 -8 12 -8 -12 z`} />
          <text x={x(f.km)} y={30} textAnchor="middle" className="font-display" fontWeight={600} fontSize={16} letterSpacing={1.2}>
            {f.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
