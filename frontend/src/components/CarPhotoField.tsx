import { useState, type ChangeEvent } from 'react';
import { uploadFile } from '../api/upload';
import { getErrorMessage } from '../api/axios';
import type { CarPhotoView } from '../api/cars';
import Icon from './Icon';

interface Props {
  url: string | null;
  view: CarPhotoView;
  onChange: (value: { url: string | null; view: CarPhotoView }) => void;
}

const VIEWS: { value: CarPhotoView; label: string; hint: string; icon: string }[] = [
  { value: 'FRONT', label: 'Zepředu', hint: 'auto celé, přesně zepředu', icon: 'M5 13V9l2-4h10l2 4v4M4 13h16v4H4zM6 17v2M18 17v2M8 9h8' },
  { value: 'SIDE', label: 'Z boku', hint: 'auto celé, přesně z boku', icon: 'M2 15v-3l3-1 3-4h7l4 4 3 1v3zM6 17.5a1.5 1.5 0 1 0 0-.01M17 17.5a1.5 1.5 0 1 0 0-.01' },
];

// Fotka auta pro garáž a přehled. Uživatel zvolí, odkud je vyfocená – podle toho se fotka
// v garáži ořízne. Poměr stran slouží jen jako upozornění, ne jako zákaz.
export default function CarPhotoField({ url, view, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [ratio, setRatio] = useState<number | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const result = await uploadFile(file);
      onChange({ url: result.url, view });
    } catch (err) {
      setError(getErrorMessage(err, 'Fotku se nepodařilo nahrát.'));
    } finally {
      setUploading(false);
    }
  }

  const warning = ratio == null ? null
    : view === 'FRONT' && ratio > 1.9 ? 'Fotka je hodně široká – nebude spíš z boku?'
      : view === 'SIDE' && ratio < 1.25 ? 'Fotka z boku bývá na šířku. Je auto vidět celé a přesně z boku?'
        : null;

  return (
    <fieldset className="space-y-2">
      <legend className="block label-caps text-xs text-ink-muted mb-1">Fotka auta (nepovinné)</legend>
      <div className="grid grid-cols-2 gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={view === v.value}
            onClick={() => onChange({ url, view: v.value })}
            className={`h-14 rounded border flex items-center gap-2 px-3 text-left ${view === v.value ? 'border-accent bg-accent-soft text-accent' : 'border-panel-border bg-asphalt-light text-ink hover:border-ink-muted'}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={v.icon} /></svg>
            <span className="leading-tight"><span className="block font-semibold text-sm">{v.label}</span><span className="block text-xs opacity-80">{v.hint}</span></span>
          </button>
        ))}
      </div>
      <ul className="text-xs text-ink-muted list-disc pl-4 space-y-0.5">
        <li><b>Do garáže se hodí fotka zepředu</b> – auto z ní vystřihneme a postavíme do stání.</li>
        <li>Celé auto v záběru, telefon ve výšce světel, ne šikmo.</li>
        <li>Za světla, bez lidí a dalších aut před ním.</li>
        <li>JPEG, PNG nebo WEBP do 10 MB.</li>
      </ul>
      {url && (
        <div className="relative rounded border border-panel-border overflow-hidden bg-asphalt-light">
          <img
            src={url}
            alt="Náhled fotky auta"
            onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
            className={`w-full ${view === 'FRONT' ? 'h-44 object-cover' : 'h-36 object-contain'}`}
          />
          <button type="button" onClick={() => onChange({ url: null, view })} className="absolute top-2 right-2 h-8 px-2.5 rounded bg-black/70 text-[#fff] text-xs inline-flex items-center gap-1">
            <Icon name="trash" size={14} /> Odebrat
          </button>
        </div>
      )}
      {warning && <p className="text-xs text-accent">{warning}</p>}
      <label className={`h-11 px-4 rounded border border-dashed border-ink-muted inline-flex items-center gap-2 cursor-pointer text-sm ${uploading ? 'opacity-60 pointer-events-none' : 'hover:border-ink'}`}>
        <Icon name="camera" size={16} /> {uploading ? 'Nahrávám…' : url ? 'Nahrát jinou fotku' : 'Nahrát fotku'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="sr-only" />
      </label>
      {error && <p role="alert" className="text-warning-red text-xs">{error}</p>}
    </fieldset>
  );
}
