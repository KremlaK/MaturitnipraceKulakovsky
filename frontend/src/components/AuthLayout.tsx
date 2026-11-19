import { useState, type ReactNode } from 'react';
import Icon from './Icon';
import { fieldClass, labelClass, passwordStrength } from '../lib/ui';

// Společný vzhled přihlášení, registrace a obnovy hesla
export default function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Icon name="logo" size={40} className="text-accent mx-auto mb-2" />
          <p className="text-3xl font-display font-bold text-ink tracking-[0.08em]">AUTOAPP</p>
          <p className="text-ink-muted text-sm mt-1">Digitální garáž a servisní knížka</p>
        </div>
        <div className="bg-panel border border-panel-border rounded-lg p-6 sm:p-8">
          <h1 className="label-caps text-lg mb-5">{title}</h1>
          {children}
        </div>
        {footer && <div className="text-center mt-5 text-sm text-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}


export function PasswordField({
  label, value, onChange, autoComplete, id, describedBy, minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: 'current-password' | 'new-password';
  id: string;
  describedBy?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          className={`${fieldClass} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1.5 h-9 px-3 rounded text-sm text-ink-muted hover:text-ink"
          aria-pressed={visible}
        >
          {visible ? 'Skrýt' : 'Zobrazit'}
        </button>
      </div>
    </div>
  );
}

const STRENGTH = ['Příliš krátké', 'Slabé', 'Ujde', 'Dobré', 'Silné'];

export function StrengthMeter({ password, id }: { password: string; id: string }) {
  const score = passwordStrength(password);
  return (
    <div id={id} className="mt-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 rounded-full ${score >= i ? (score <= 1 ? 'bg-warning-red' : score === 2 ? 'bg-accent' : 'bg-ok') : 'bg-panel-border'}`} />
        ))}
      </div>
      <p className="text-xs text-ink-muted mt-1">
        {password ? `Síla hesla: ${STRENGTH[score]}` : 'Aspoň 8 znaků. Delší heslo nebo věta je lepší než složité znaky.'}
      </p>
    </div>
  );
}
