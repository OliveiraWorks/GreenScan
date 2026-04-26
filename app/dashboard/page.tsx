'use client';
// ============================================================
// Dashboard — Painel pessoal do usuário autenticado
// Rota protegida: redireciona para home se não autenticado
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { WasteReport } from '@/lib/types';
import ReportCard from '@/components/ReportCard';
import type { User } from '@supabase/supabase-js';

type TabType = 'all' | 'confirmed' | 'rejected';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
  }, []);

  // ── Fetch reports do usuário ──────────────────────────────
  const fetchMyReports = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as WasteReport[]) ?? []);
    } catch (e) {
      console.error('Erro ao buscar reports:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchMyReports(user.id);
  }, [user, fetchMyReports]);

  // ── Estatísticas ──────────────────────────────────────────
  const total = reports.length;
  const confirmed = reports.filter((r) => r.status === 'confirmed').length;
  const rejected = reports.filter((r) => r.status === 'rejected').length;
  const acceptanceRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  // ── Filtro por tab ────────────────────────────────────────
  const filteredReports = reports.filter((r) => {
    if (activeTab === 'confirmed') return r.status === 'confirmed';
    if (activeTab === 'rejected') return r.status === 'rejected';
    return true;
  });

  // ── Loading de autenticação ───────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-inter text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // ── Não autenticado ───────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EBF5DC] via-white to-[#C8E6A0]/30 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl border border-green-100 p-10 max-w-md w-full animate-fadeIn">
          <div className="w-16 h-16 bg-[#EBF5DC] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#3B6D11]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-syne font-bold text-2xl text-[#3B6D11] mb-2">Acesso Restrito</h1>
          <p className="text-gray-500 font-inter text-sm mb-6 leading-relaxed">
            Faça login para acessar seu painel de denúncias e acompanhar suas contribuições.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#2A4D0C] text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 font-inter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-green-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500 font-inter truncate max-w-[180px]">
              {user.email}
            </span>
            <button
              id="dashboard-logout-btn"
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-all font-inter"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Title ── */}
        <div className="animate-fadeIn">
          <h1 className="font-syne font-bold text-2xl sm:text-3xl text-gray-900">
            Meu Dashboard
          </h1>
          <p className="text-gray-400 font-inter text-sm mt-1">
            Acompanhe suas denúncias e contribuições para o GreenScan
          </p>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slideUp">
          {[
            {
              label: 'Total enviado',
              value: total,
              icon: '📤',
              color: 'from-blue-50 to-blue-100/50',
              border: 'border-blue-200',
              textColor: 'text-blue-700',
            },
            {
              label: 'Confirmados',
              value: confirmed,
              icon: '✅',
              color: 'from-green-50 to-green-100/50',
              border: 'border-green-200',
              textColor: 'text-[#3B6D11]',
            },
            {
              label: 'Rejeitados',
              value: rejected,
              icon: '❌',
              color: 'from-red-50 to-red-100/50',
              border: 'border-red-200',
              textColor: 'text-red-700',
            },
            {
              label: 'Taxa de aceitação',
              value: `${acceptanceRate}%`,
              icon: '📊',
              color: 'from-amber-50 to-amber-100/50',
              border: 'border-amber-200',
              textColor: 'text-amber-700',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 shadow-sm`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`font-syne font-bold text-3xl ${stat.textColor}`}>
                {loading ? '—' : stat.value}
              </div>
              <div className="text-xs text-gray-500 font-inter mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Acceptance rate bar ── */}
        {!loading && total > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-gray-700 font-inter">Taxa de aceitação pela IA</span>
              <span className="font-bold text-[#3B6D11] font-inter">{acceptanceRate}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#97C459] to-[#3B6D11] rounded-full transition-all duration-700"
                style={{ width: `${acceptanceRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 font-inter mt-2">
              {confirmed} de {total} denúncias foram confirmadas pela análise de IA
            </p>
          </div>
        )}

        {/* ── Reports list ── */}
        <div>
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
            {([
              { key: 'all', label: `Todas (${total})` },
              { key: 'confirmed', label: `Confirmadas (${confirmed})` },
              { key: 'rejected', label: `Rejeitadas (${rejected})` },
            ] as { key: TabType; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all font-inter ${
                  activeTab === tab.key
                    ? 'bg-white text-[#3B6D11] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🌿</div>
              <p className="font-semibold text-gray-600 font-inter">
                {activeTab === 'all'
                  ? 'Você ainda não enviou nenhuma denúncia'
                  : `Nenhuma denúncia ${activeTab === 'confirmed' ? 'confirmada' : 'rejeitada'}`}
              </p>
              <p className="text-sm text-gray-400 font-inter mt-1.5 mb-5">
                Contribua para um ambiente mais limpo reportando descartes irregulares.
              </p>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#2A4D0C] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all font-inter"
              >
                + Enviar primeira denúncia
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
