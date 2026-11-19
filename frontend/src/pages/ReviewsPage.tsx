import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import { deleteReview, getReviews, saveReview, type ReviewsData } from '../api/feedback';
import { getErrorMessage } from '../api/axios';
import { fieldClass } from '../lib/ui';
import { fmtDate, fmtDec } from '../lib/carStatus';

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-accent" aria-label={`${value} z 5 hvězdiček`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
          fill={i <= Math.round(value) ? 'currentColor' : 'none'} aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}

const LABELS = ['', 'Nic moc', 'Ujde to', 'Dobré', 'Velmi dobré', 'Skvělé'];

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => getReviews().then((d) => {
    setData(d);
    if (d.mine) {
      setRating(d.mine.rating);
      setText(d.mine.text ?? '');
    }
  }).catch((e) => setMsg({ ok: false, text: getErrorMessage(e) })), []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) return setMsg({ ok: false, text: 'Vyber počet hvězdiček.' });
    setSaving(true);
    setMsg(null);
    try {
      await saveReview(rating, text);
      setMsg({ ok: true, text: data?.mine ? 'Recenze upravena. Díky!' : 'Díky za recenzi!' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Opravdu smazat svou recenzi?')) return;
    await deleteReview();
    setRating(0);
    setText('');
    setMsg({ ok: true, text: 'Recenze smazána.' });
    load();
  }

  const shown = hover || rating;

  return (
    <AppShell>
      <div className="px-4 md:px-7 py-5 md:py-7">
        <h1 className="font-display font-bold text-2xl md:text-[32px] uppercase tracking-wide">Recenze</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-5 mt-5 items-start">
          <div className="space-y-5">
            <Panel title="Hodnocení uživatelů">
              <div className="p-[18px]">
                {data && data.total > 0 ? (
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <p className="font-mono-gauge text-5xl font-semibold leading-none">{fmtDec(data.average ?? 0)}</p>
                      <Stars value={data.average ?? 0} />
                      <p className="text-xs text-ink-muted mt-1">{data.total} {data.total === 1 ? 'recenze' : data.total < 5 ? 'recenze' : 'recenzí'}</p>
                    </div>
                    <ul className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = data.counts[star - 1];
                        return (
                          <li key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 font-mono-gauge">{star}</span>
                            <span className="flex-1 h-2 rounded-full bg-asphalt-light overflow-hidden">
                              <span className="block h-full bg-accent" style={{ width: `${(count / data.total) * 100}%` }} />
                            </span>
                            <span className="w-6 text-right text-ink-muted font-mono-gauge">{count}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="text-ink-muted text-sm">Zatím žádné recenze. Buď první!</p>
                )}
              </div>
            </Panel>

            <Panel title={data?.mine ? 'Moje recenze' : 'Napsat recenzi'}>
              <form onSubmit={submit} className="p-[18px] space-y-3">
                <fieldset>
                  <legend className="block label-caps text-xs text-ink-muted mb-1.5">Hodnocení</legend>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)}
                        aria-label={`${i} z 5 – ${LABELS[i]}`} aria-pressed={rating === i}
                        className="p-1 text-accent">
                        <svg width="34" height="34" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={i <= shown ? 'currentColor' : 'none'} aria-hidden="true">
                          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-ink-muted">{LABELS[shown]}</span>
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="review-text" className="block label-caps text-xs text-ink-muted mb-1">Co se ti líbí a co bys zlepšil? (nepovinné)</label>
                  <textarea id="review-text" rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} className={`${fieldClass} h-auto py-2.5`} />
                </div>
                <p className="text-xs text-ink-muted">U recenze se zobrazí jen tvoje křestní jméno.</p>
                {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-ok' : 'text-warning-red'}`}>{msg.text}</p>}
                <div className="flex gap-3">
                  <button disabled={saving} className="h-11 px-5 rounded bg-accent text-on-accent label-caps text-sm disabled:opacity-50">
                    {data?.mine ? 'Uložit změny' : 'Odeslat recenzi'}
                  </button>
                  {data?.mine && (
                    <button type="button" onClick={remove} className="h-11 px-4 rounded border border-panel-border text-ink-muted hover:text-warning-red inline-flex items-center gap-1.5 text-sm">
                      <Icon name="trash" size={16} /> Smazat
                    </button>
                  )}
                </div>
              </form>
            </Panel>
          </div>

          <Panel title="Co píšou ostatní" aside={data ? `${data.reviews.length}` : undefined}>
            {!data ? (
              <p className="p-[18px] text-ink-muted">Načítám…</p>
            ) : data.reviews.length === 0 ? (
              <p className="p-[18px] text-ink-muted">Zatím nikdo nic nenapsal.</p>
            ) : (
              <ul className="divide-y divide-panel-border">
                {data.reviews.map((r) => (
                  <li key={r.id} className="px-[18px] py-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Stars value={r.rating} size={16} />
                      <b>{r.author}</b>
                      {r.isMine && <span className="label-caps text-[11px] text-ink-muted border border-panel-border rounded px-1.5">Ty</span>}
                      <span className="text-xs text-ink-muted ml-auto">{fmtDate(r.updatedAt)}</span>
                    </div>
                    {r.text && <p className="mt-2 text-ink leading-relaxed whitespace-pre-line">{r.text}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
