import { useState, type ChangeEvent } from 'react';
import { uploadFile } from '../api/upload';

interface Props {
  label: string;
  accept?: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

function FileUpload({ label, accept = 'image/*,application/pdf', currentUrl, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const result = await uploadFile(file);
      onUploaded(result.url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nahrání se nezdařilo.');
    } finally {
      setUploading(false);
    }
  }

  const isImage = currentUrl && !currentUrl.endsWith('.pdf');

  return (
    <div>
      <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">{label}</label>

      {currentUrl && isImage && (
        <img src={currentUrl} alt="Náhled" className="w-full h-32 object-cover rounded mb-2 border border-panel-border" />
      )}
      {currentUrl && !isImage && (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-gauge-yellow hover:underline text-sm block mb-2 font-mono-gauge">
          📄 Zobrazit nahraný soubor
        </a>
      )}

      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={uploading}
        className="w-full text-sm text-slate-400 font-mono-gauge file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-gauge-yellow file:text-black file:font-bold file:cursor-pointer hover:file:brightness-110 disabled:opacity-50"
      />

      {uploading && <p className="text-slate-500 text-xs mt-1 font-mono-gauge">Nahrávám...</p>}
      {error && <p className="text-warning-red text-xs mt-1 font-mono-gauge">{error}</p>}
    </div>
  );
}

export default FileUpload;