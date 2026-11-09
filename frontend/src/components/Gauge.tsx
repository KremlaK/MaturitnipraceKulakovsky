interface Props {
  value: number;
  max: number;
  label: string;
  unit?: string;
}

function Gauge({ value, max, label, unit = 'Kč' }: Props) {
  const percentage = Math.min(value / max, 1);
  const angle = -90 + percentage * 180; // -90° (vlevo) až 90° (vpravo)

  const isWarning = percentage > 0.75;
  const isDanger = percentage > 0.95;

  const needleColor = isDanger ? '#e6342a' : isWarning ? '#ff5500' : '#ffcc00';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[220px]">
        {/* Podkladový oblouk */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--c-panel-border)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Barevný oblouk podle úrovně */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={needleColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 251} 251`}
          opacity="0.9"
        />
        {/* Ručička */}
        <g transform={`rotate(${angle} 100 100)`} style={{ transition: 'transform 0.6s ease-out' }}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="var(--c-ink)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="7" fill="var(--c-ink)" />
        </g>
        {/* Značky E / F */}
        <text x="14" y="115" fill="var(--c-ink-muted)" fontSize="10" fontFamily="JetBrains Mono">E</text>
        <text x="180" y="115" fill="var(--c-ink-muted)" fontSize="10" fontFamily="JetBrains Mono">F</text>
      </svg>
      <p className="font-mono-gauge text-2xl font-bold text-ink -mt-2">
        {value.toLocaleString('cs-CZ')} <span className="text-sm text-ink-muted">{unit}</span>
      </p>
      <p className="text-ink-muted text-xs uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

export default Gauge;
