import { useEffect, useState } from 'react';

interface Props {
  photos: string[];
  intervalMs?: number;
}

export default function PhotoCarousel({ photos, intervalMs = 3500 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [photos.join('|')]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [photos.join('|'), intervalMs]);

  return (
    <div className="mb-4">
      <div className="aspect-square rounded-xl overflow-hidden border shadow bg-white">
        <img src={photos[index]} className="w-full h-full object-cover" />
      </div>
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                i === index ? 'bg-brand-600' : 'bg-brand-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
