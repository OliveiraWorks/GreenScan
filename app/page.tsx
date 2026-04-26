'use client';
// ============================================================
// Home Page — Mapa fullscreen + Modal de denúncia
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ReportForm from '@/components/ReportForm';
import { WasteReport } from '@/lib/types';

// Importação dinâmica do mapa — SSR desativado para evitar erro do Leaflet
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#EBF5DC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#3B6D11] font-semibold font-inter">Carregando mapa...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Busca denúncias confirmadas
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Erro ao buscar reports:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchReports, 60_000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleSuccess = () => {
    // Aguarda 2s para o banco processar e recarrega
    setTimeout(fetchReports, 2000);
    setTimeout(() => setModalOpen(false), 4500);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">

      {/* ── Navbar ── */}
      <Navbar
        onReportClick={() => setModalOpen(true)}
        reportCount={loading ? undefined : reports.length}
      />

      {/* ── Mapa fullscreen ── */}
      <div className="absolute inset-0 pt-16">
        {!loading && <MapComponent reports={reports} />}
      </div>

      {/* ── Legenda de severidade (canto inferior esquerdo) ── */}
      <div className="absolute bottom-6 left-4 z-[999] bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg p-4 hidden sm:block">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 font-inter">Severidade</p>
        <div className="space-y-2">
          {[
            { label: 'Alta', color: '#A32D2D' },
            { label: 'Média', color: '#BA7517' },
            { label: 'Baixa', color: '#639922' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                style={{ background: color }}
              />
              <span className="text-xs text-gray-600 font-inter">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Botão flutuante "+ Reportar" ── */}
      <button
        id="fab-report-btn"
        onClick={() => setModalOpen(true)}
        className="absolute bottom-6 right-6 z-[999] bg-[#3B6D11] hover:bg-[#2A4D0C] text-white font-semibold px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-2xl flex items-center gap-2.5 transition-all hover:-translate-y-1 active:translate-y-0 font-inter"
      >
        <span className="text-xl leading-none">+</span>
        <span>Reportar</span>
      </button>

      {/* ── Counter badge (mobile) ── */}
      {!loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[999] sm:hidden bg-white/90 backdrop-blur-md border border-green-100 rounded-full px-4 py-1.5 shadow">
          <span className="text-xs font-medium text-[#3B6D11] font-inter flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B6D11] animate-pulse" />
            {reports.length} {reports.length === 1 ? 'denúncia' : 'denúncias'}
          </span>
        </div>
      )}

      {/* ── Modal de denúncia ── */}
      {modalOpen && (
        <div
          id="report-modal-overlay"
          className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal panel */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl z-10">
              <div>
                <h2 className="font-syne font-bold text-lg text-[#3B6D11]">
                  Nova Denúncia
                </h2>
                <p className="text-xs text-gray-400 font-inter mt-0.5">
                  A imagem será analisada por IA antes do registro
                </p>
              </div>
              <button
                id="close-modal-btn"
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5">
              <ReportForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
