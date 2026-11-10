import { useState } from 'react';
import { PHOTO_CATEGORY_LABELS, type Photo } from '../api/photos';
import Icon from './Icon';

interface Props {
  photos: Photo[];
  onDelete: (id: string) => void;
}

function PhotoGallery({ photos, onDelete }: Props) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return <p className="text-ink-muted font-mono-gauge text-sm">Zatím žádné fotky v galerii.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden border border-panel-border bg-panel cursor-pointer"
            onClick={() => setLightboxPhoto(photo)}
          >
            <img src={photo.url} alt={photo.caption || ''} className="w-full h-32 object-cover" />
            <div className="absolute top-1 left-1 bg-black/70 text-accent text-[10px] font-mono-gauge px-1.5 py-0.5 rounded uppercase">
              {PHOTO_CATEGORY_LABELS[photo.category]}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
              className="absolute top-1 right-1 bg-black/70 text-[#eee] hover:text-[#ff8a7a] w-8 h-8 rounded flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition"
              aria-label="Smazat fotku"
            >
              <Icon name="close" size={16} />
            </button>
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[#fff] text-xs px-2 py-1 truncate">
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center px-4 z-50"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 text-[#fff] hover:text-accent"
            aria-label="Zavřít"
          >
            <Icon name="close" size={28} />
          </button>
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.caption || ''}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxPhoto.caption && (
            <p className="absolute bottom-6 text-white font-mono-gauge text-sm bg-black/70 px-3 py-1.5 rounded">
              {lightboxPhoto.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}

export default PhotoGallery;
