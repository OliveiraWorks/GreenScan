// ============================================================
// Página /report — Formulário dedicado de denúncia
// ============================================================
import React from 'react';
import Link from 'next/link';
import ReportForm from '@/components/ReportForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reportar Descarte | GreenScan',
  description: 'Envie uma denúncia de descarte irregular de resíduos. Nossa IA analisa a imagem e registra automaticamente no mapa público.',
};

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBF5DC] via-white to-[#C8E6A0]/30">
      {/* Header */}
      <header className="bg-white border-b border-green-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#3B6D11] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7l1 3h6l1-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" fill="#97C459"/>
                <circle cx="12" cy="10" r="3" fill="white" opacity="0.9"/>
                <path d="M12 8.5 L14 10 L12 11.5 L10 10 Z" fill="#3B6D11"/>
              </svg>
            </div>
            <span className="font-syne font-bold text-xl text-[#3B6D11]">
              Green<span className="text-[#97C459]">Scan</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-[#3B6D11] flex items-center gap-1.5 transition-colors font-inter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao mapa
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="font-syne font-bold text-3xl text-[#3B6D11] mb-2">
            Reportar Descarte Irregular
          </h1>
          <p className="text-gray-500 font-inter text-base max-w-md mx-auto leading-relaxed">
            Fotografe o descarte, compartilhe a localização e nossa IA verificará automaticamente. Se confirmado, o registro aparece no mapa público.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📸', step: '1', title: 'Fotografe', desc: 'Tire uma foto clara do descarte irregular' },
            { icon: '🤖', step: '2', title: 'IA Analisa', desc: 'Modelo de visão verifica o descarte' },
            { icon: '🗺️', step: '3', title: 'Mapa', desc: 'Aparece no mapa público em segundos' },
          ].map((item) => (
            <div key={item.step} className="text-center bg-white rounded-2xl border border-green-100 p-4 shadow-sm">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="w-5 h-5 rounded-full bg-[#3B6D11] text-white text-xs font-bold flex items-center justify-center mx-auto mb-1.5 font-inter">
                {item.step}
              </div>
              <p className="font-semibold text-sm text-gray-800 font-inter">{item.title}</p>
              <p className="text-xs text-gray-400 font-inter mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl border border-green-100 shadow-lg p-8">
          <ReportForm />
        </div>
      </main>
    </div>
  );
}
