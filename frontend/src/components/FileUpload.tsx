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
      <label className="block text-slate-300 text-sm mb-1">{label}</label>

      {currentUrl && isImage && (
        <img src={currentUrl} alt="Náhled" className="w-full h-32 object-cover rounded mb-2" />
      )}
      {currentUrl && !isImage && (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm block mb-2">
          📄 Zobrazit nahraný soubor
        </a>
      )}

      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={uploading}
        className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700 disabled:opacity-50"
      />

      {uploading && <p className="text-slate-400 text-xs mt-1">Nahrávám...</p>}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default FileUpload;