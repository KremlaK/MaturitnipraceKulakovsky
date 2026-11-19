// Sdílené třídy formulářů a drobné pomocné funkce pro UI
export const fieldClass =
  'w-full h-12 px-3 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent text-base';
export const labelClass = 'block label-caps text-xs text-ink-muted mb-1';
export const primaryButton =
  'w-full h-12 rounded bg-accent text-on-accent label-caps text-base disabled:opacity-50 inline-flex items-center justify-center gap-2';

/** Jednoduchý odhad síly hesla 0–4 (délka a různorodost znaků). */
export function passwordStrength(pw: string) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  return score;
}

/** Nominatim vrací dlouhé adresy – pro pumpu stačí první části („Orlen, Hradecká, Brno“). */
export function shortPlaceName(name: string) {
  return name.split(',').map((p) => p.trim()).filter(Boolean).slice(0, 3).join(', ');
}
