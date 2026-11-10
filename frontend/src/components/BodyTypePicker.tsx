import type { CarBodyType } from '../api/cars';
import { guessBodyType, type BodyType } from '../lib/carStatus';

const OPTIONS: { value: CarBodyType; label: string; drawing: BodyType }[] = [
  { value: 'HATCHBACK', label: 'Hatchback', drawing: 'hatch' },
  { value: 'SEDAN', label: 'Sedan', drawing: 'sedan' },
  { value: 'KOMBI', label: 'Kombi', drawing: 'combi' },
  { value: 'SUV', label: 'SUV', drawing: 'suv' },
];

// Malé obrysy pro tlačítka (24 × 12)
const MINI: Record<BodyType, string> = {
  hatch: 'M2 9.5V7.5L4 4.5L8 3.5H13.5L17 6.5L21.5 7.3L22 9.5Z',
  sedan: 'M2 9.5V7.6L5 7L8 4L11 3.5H14L17 5.8L21.5 6.8L22 9.5Z',
  combi: 'M2 9.5V5.2L3.5 3.5H14L17.5 6.2L21.5 7L22 9.5Z',
  suv: 'M2 9.5V4.5L3.5 2.5H14.5L18 5.3L21.8 6L22 9.5Z',
};

interface Props {
  value: CarBodyType | null;
  onChange: (value: CarBodyType | null) => void;
  /** Značka a model – z nich se ukáže odhad, když typ není vybraný. */
  makeModel: string;
}

export default function BodyTypePicker({ value, onChange, makeModel }: Props) {
  const guess = OPTIONS.find((o) => o.drawing === guessBodyType(makeModel));
  return (
    <fieldset>
      <legend className="block label-caps text-xs text-ink-muted mb-1">Karoserie</legend>
      <div className="grid grid-cols-4 gap-1.5">
        {OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : o.value)}
              className={`h-14 rounded border flex flex-col items-center justify-center gap-1 text-xs font-medium ${
                active ? 'border-accent bg-accent-soft text-accent' : 'border-panel-border bg-asphalt-light text-ink hover:border-ink-muted'
              }`}
            >
              <svg width="36" height="18" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
                <path d={MINI[o.drawing]} />
                <circle cx="6.5" cy="9.5" r="1.8" />
                <circle cx="17.5" cy="9.5" r="1.8" />
              </svg>
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-ink-muted text-xs mt-1">
        {value ? 'Podle toho se kreslí výkres na Přehledu.' : `Nevybráno – výkres odhadne ${guess ? guess.label.toLowerCase() : 'typ'} podle názvu.`}
      </p>
    </fieldset>
  );
}
