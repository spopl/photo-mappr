import { useRef, useState } from 'react';
import { socket } from '../socket';
import type { PlayerPublic, RoomPublicState } from '../types';

interface Props {
  room: RoomPublicState;
  me: PlayerPublic | undefined;
}

const ALLOWED_EXT = ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp'];

function fileToDataUrl(fileOrBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

/** HEIC/HEIF isn't renderable by <img>, so convert it to a JPEG data URL first. */
async function toDisplayableDataUrl(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isHeic = ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';
  if (isHeic) {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return fileToDataUrl(blob as Blob);
  }
  return fileToDataUrl(file);
}

export default function Upload({ room, me }: Props) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const required = room.photoCountRequired;

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const remaining = required - photos.length;
    const chosen = Array.from(files).slice(0, remaining);
    setProcessing(true);
    for (const f of chosen) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXT.includes(ext)) {
        setError(`${f.name}: unsupported file type. Use JPG, PNG, WEBP, or HEIC.`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        setError(`${f.name} is over 5MB`);
        continue;
      }
      try {
        const dataUrl = await toDisplayableDataUrl(f);
        setPhotos((prev) => [...prev, dataUrl]);
      } catch {
        setError(`Couldn't process ${f.name}. Try a different photo.`);
      }
    }
    setProcessing(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    socket.emit('room:submitPhotos', { code: room.code, photos });
    setSubmitted(true);
  }

  const others = room.players.filter((p) => p.connected);
  const doneCount = others.filter((p) => p.photoCount >= required).length;

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-brand-700 text-center mb-1">
        Upload {required} Baby Photo{required > 1 ? 's' : ''}
      </h1>
      <p className="text-center text-brand-600 mb-6">Ages 0–4. JPG, PNG, WEBP, or HEIC. Max 5MB each.</p>

      {error && <div className="bg-red-100 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {!submitted ? (
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                <img src={p} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < required && (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={processing}
                className="aspect-square rounded-lg border-2 border-dashed border-brand-300 text-brand-500 flex items-center justify-center text-3xl disabled:opacity-40"
              >
                {processing ? '…' : '+'}
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            disabled={photos.length < required || processing}
            onClick={submit}
            className="w-full bg-brand-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3"
          >
            {processing ? 'Processing photo...' : 'Submit Photos'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow p-4 mb-4 text-center">
          <p className="text-brand-700 font-medium">✅ Photos submitted!</p>
          <p className="text-sm text-brand-500 mt-1">
            Waiting for others... ({doneCount}/{others.length})
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold text-brand-700 mb-2">Upload status</h2>
        <ul>
          {others.map((p) => (
            <li key={p.id} className="flex justify-between py-1 border-b last:border-0">
              <span>{p.name}</span>
              <span>{p.photoCount >= required ? '✅' : '⏳'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
