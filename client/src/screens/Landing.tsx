import { useState } from 'react';

interface Props {
  prefillCode: string | null;
  onCreate: (name: string, photoCount: number) => void;
  onJoin: (code: string, name: string) => void;
  error: string | null;
}

export default function Landing({ prefillCode, onCreate, onJoin, error }: Props) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(prefillCode ? 'join' : 'choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState(prefillCode || '');
  const [photoCount, setPhotoCount] = useState(2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-extrabold text-center mb-1 bg-gradient-to-r from-party-pink via-party-purple to-party-blue bg-clip-text text-transparent">
          👶 Face Mappr
        </h1>
        <p className="text-center text-brand-600 mb-6 font-medium">Guess who's who in baby photos!</p>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        {mode === 'choose' && (
          <div className="flex flex-col gap-3">
            <button
              className="bg-gradient-to-r from-party-pink to-party-red text-white font-bold rounded-2xl py-3 shadow-lg active:scale-95 transition"
              onClick={() => setMode('create')}
            >
              🎉 Create a Room
            </button>
            <button
              className="bg-gradient-to-r from-party-blue to-party-purple text-white font-bold rounded-2xl py-3 shadow-lg active:scale-95 transition"
              onClick={() => setMode('join')}
            >
              🙋 Join a Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="flex flex-col gap-3 bg-white rounded-2xl p-5 shadow">
            <label className="text-sm font-medium text-brand-700">Your name</label>
            <input
              className="border rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={20}
            />
            <label className="text-sm font-medium text-brand-700">Photos per player</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setPhotoCount(n)}
                  className={`flex-1 rounded-lg py-2 font-semibold border-2 ${
                    photoCount === n
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-brand-200 text-brand-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              disabled={!name.trim()}
              className="mt-2 bg-brand-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3"
              onClick={() => onCreate(name.trim(), photoCount)}
            >
              Create Room
            </button>
            <button className="text-sm text-brand-500" onClick={() => setMode('choose')}>
              ← Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-3 bg-white rounded-2xl p-5 shadow">
            <label className="text-sm font-medium text-brand-700">Room code</label>
            <input
              className="border rounded-lg px-3 py-2 uppercase tracking-widest text-center text-xl font-bold"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDE"
              maxLength={5}
            />
            <label className="text-sm font-medium text-brand-700">Your name</label>
            <input
              className="border rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={20}
            />
            <button
              disabled={!name.trim() || code.trim().length < 4}
              className="mt-2 bg-brand-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3"
              onClick={() => onJoin(code.trim(), name.trim())}
            >
              Join Room
            </button>
            <button className="text-sm text-brand-500" onClick={() => setMode('choose')}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
