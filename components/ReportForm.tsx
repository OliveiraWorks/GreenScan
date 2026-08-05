'use client';
// ============================================================
// ReportForm — Formulário de envio de denúncia de descarte
// Suporta: drag & drop, câmera nativa mobile, preview inline,
//          geolocalização robusta, seleção manual no mapa
// ============================================================
import React, { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CreateReportResponse } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border-2 border-[#97C459] bg-[#EBF5DC] flex items-center justify-center" style={{ height: 220 }}>
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#3B6D11]">Carregando mapa...</p>
      </div>
    </div>
  ),
});

type FormState = 'idle' | 'analyzing' | 'success' | 'rejected' | 'error';
type LocationMode = 'gps' | 'map';

interface ReportFormProps {
  onSuccess?: () => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationMode, setLocationMode] = useState<LocationMode>('gps');
  const [dragging, setDragging] = useState(false);
  const [formState, setFormState] = useState<FormState>('idle');
  const [feedback, setFeedback] = useState('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isMobile = () =>
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ── Handlers de arquivo ──────────────────────────────────
  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      alert('Apenas imagens JPEG, PNG ou WebP são aceitas.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 20MB.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── Reverse Geocoding ────────────────────────────────────
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' }, signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      return json.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  // ── Seleção manual no mapa ───────────────────────────────
  const handleMapSelect = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationError('');
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
  };

  // ── GPS ──────────────────────────────────────────────────
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador.');
      return;
    }
    setLocating(true);
    setLocationError('');

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setLatitude(lat); setLongitude(lng);
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr);
          setLocating(false);
        },
        (err) => {
          setLocating(false);
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setLocationError('Permissão negada. Use o modo "Selecionar no mapa" abaixo.');
              break;
            case err.POSITION_UNAVAILABLE:
              setLocationError('Localização indisponível. Use o modo "Selecionar no mapa" abaixo.');
              break;
            default:
              setLocationError('GPS indisponível. Use o modo "Selecionar no mapa" abaixo.');
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat); setLongitude(lng);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setLocating(false);
      },
      () => tryLowAccuracy(),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Compressão + Base64 ──────────────────────────────────
  const compressAndToBase64 = (f: File): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao comprimir imagem'));
            const reader = new FileReader();
            reader.onload = (e) =>
              resolve({
                base64: (e.target?.result as string).split(',')[1],
                mime: 'image/jpeg',
              });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          0.75
        );
      };
      img.onerror = reject;
      img.src = url;
    });

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { alert('Selecione uma imagem.'); return; }
    if (latitude === null || longitude === null) {
      alert('Marque a localização: use o GPS ou clique no mapa.'); return;
    }

    setFormState('analyzing');
    setFeedback('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { base64: image_file, mime: mime_type_compressed } = await compressAndToBase64(file);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_file,
          mime_type: mime_type_compressed,
          latitude,
          longitude,
          address: address || undefined,
          user_id: user?.id ?? undefined,
        }),
      });

      const data: CreateReportResponse = await res.json();

      if (!res.ok) {
        setFormState('error');
        setFeedback(data.reason ?? 'Erro ao enviar a denúncia.');
        return;
      }

      if (data.accepted) {
        setFormState('success');
        setFeedback('Descarte registrado com sucesso! Já aparece no mapa.');
        onSuccess?.();
        setTimeout(() => {
          setFile(null); setPreview(null);
          setLatitude(null); setLongitude(null);
          setAddress(''); setLocationError('');
          setFormState('idle'); setFeedback('');
        }, 4000);
      } else {
        setFormState('rejected');
        setFeedback(data.reason ?? 'Nenhum descarte irregular detectado na imagem.');
      }
    } catch {
      setFormState('error');
      setFeedback('Erro de conexão. Verifique sua internet e tente novamente.');
    }
  };

  const isSubmitting = formState === 'analyzing';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-inter">

      {/* ── Upload ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Foto do descarte <span className="text-red-400">*</span>
        </label>
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#97C459]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-52 object-cover" />
            <button type="button" onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-md text-sm transition-all">✕</button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
              <p className="text-white text-xs truncate">{file?.name}</p>
            </div>
          </div>
        ) : (
          <>
            <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onClick={() => galleryInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all
                ${dragging ? 'border-[#3B6D11] bg-[#EBF5DC] scale-[1.02]' : 'border-gray-200 bg-gray-50 hover:border-[#97C459] hover:bg-[#EBF5DC]/50'}`}>
              <div className="text-center space-y-2 px-4">
                <div className="w-12 h-12 rounded-full bg-[#EBF5DC] flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-[#3B6D11]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Arraste uma foto ou <span className="text-[#3B6D11] font-semibold">clique para selecionar</span></p>
                <p className="text-xs text-gray-400">JPEG, PNG ou WebP — máx. 20MB</p>
              </div>
              <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
            </div>
            {isMobile() && (
              <button type="button" onClick={() => cameraInputRef.current?.click()}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-[#3B6D11] text-[#3B6D11] hover:bg-[#EBF5DC] py-2.5 rounded-xl text-sm font-medium transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tirar foto agora
              </button>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
          </>
        )}
      </div>

      {/* ── Localização ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Localização <span className="text-red-400">*</span>
        </label>

        {/* Toggle GPS / Mapa */}
        <div className="flex gap-2 mb-3">
          {(['gps', 'map'] as LocationMode[]).map((mode) => (
            <button key={mode} type="button" onClick={() => setLocationMode(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all
                ${locationMode === mode ? 'bg-[#3B6D11] text-white border-[#3B6D11]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#97C459] hover:bg-[#EBF5DC]/50'}`}>
              {mode === 'gps' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  GPS
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Selecionar no mapa
                </>
              )}
            </button>
          ))}
        </div>

        {/* Modo GPS */}
        {locationMode === 'gps' && (
          <>
            <button type="button" onClick={handleGetLocation} disabled={locating}
              className="w-full flex items-center justify-center gap-2 border border-[#3B6D11] text-[#3B6D11] hover:bg-[#EBF5DC] disabled:opacity-60 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-medium transition-all">
              {locating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Obtendo localização...
                </>
              ) : (
                <>{latitude && locationMode === 'gps' ? '✓ Localização capturada — clique para atualizar' : 'Usar minha localização'}</>
              )}
            </button>
            {locationError && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-sm">⚠️</span>
                <p className="text-xs text-amber-700">{locationError}</p>
              </div>
            )}
          </>
        )}

        {/* Modo Mapa */}
        {locationMode === 'map' && (
          <LocationPicker latitude={latitude} longitude={longitude} onSelect={handleMapSelect} />
        )}

        {/* Coordenadas confirmadas */}
        {latitude && longitude && (
          <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
            <span>📍</span>
            <span className="font-mono">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          </p>
        )}
      </div>

      {/* ── Endereço ── */}
      <div>
        <label htmlFor="address-input" className="block text-sm font-semibold text-gray-700 mb-2">
          Endereço <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input id="address-input" type="text" value={address} onChange={(e) => setAddress(e.target.value)}
          placeholder="Preenchido automaticamente ou edite manualmente"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#97C459] focus:border-transparent transition-all" />
      </div>

      {/* ── Feedback ── */}
      {formState === 'success' && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-2xl">🎉</span>
          <div><p className="text-sm font-semibold text-green-800">Denúncia registrada!</p><p className="text-xs text-green-700 mt-0.5">{feedback}</p></div>
        </div>
      )}
      {formState === 'rejected' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-2xl">⚠️</span>
          <div><p className="text-sm font-semibold text-amber-800">Imagem não aprovada</p><p className="text-xs text-amber-700 mt-0.5">{feedback}</p></div>
        </div>
      )}
      {formState === 'error' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-2xl">❌</span>
          <div><p className="text-sm font-semibold text-red-800">Erro ao enviar</p><p className="text-xs text-red-700 mt-0.5">{feedback}</p></div>
        </div>
      )}

      {/* ── Botão enviar ── */}
      <button type="submit" disabled={isSubmitting || formState === 'success'}
        className="w-full bg-[#3B6D11] hover:bg-[#2A4D0C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
        {formState === 'analyzing' ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analisando imagem com IA...
          </>
        ) : formState === 'success' ? <>✓ Registrado com sucesso!</> : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Enviar denúncia
          </>
        )}
      </button>
    </form>
  );
}