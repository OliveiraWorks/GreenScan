'use client';
// ============================================================
// Navbar — Barra de navegação principal do GreenScan
// ============================================================
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

interface NavbarProps {
  onReportClick?: () => void;
  reportCount?: number;
}

export default function Navbar({ onReportClick, reportCount }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  const handleLogin = async () => {
    const email = prompt('Digite seu e-mail para receber o link de acesso:');
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert('Erro ao enviar link: ' + error.message);
    else alert('Link de acesso enviado para ' + email);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#3B6D11] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7l1 3h6l1-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" fill="#97C459"/>
                <circle cx="12" cy="10" r="3" fill="white" opacity="0.9"/>
                <path d="M12 8.5 L14 10 L12 11.5 L10 10 Z" fill="#3B6D11"/>
              </svg>
            </div>
            <span className="font-syne font-bold text-xl text-[#3B6D11] tracking-tight">
              Green<span className="text-[#97C459]">Scan</span>
            </span>
          </Link>

          {/* Center: report count */}
          {reportCount !== undefined && (
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B6D11] animate-pulse" />
              <span className="text-sm font-medium text-[#3B6D11] font-inter">
                {reportCount} {reportCount === 1 ? 'denúncia' : 'denúncias'} registradas
              </span>
            </div>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* Report button */}
            <button
              id="navbar-report-btn"
              onClick={onReportClick}
              className="hidden sm:flex items-center gap-2 bg-[#3B6D11] hover:bg-[#2A4D0C] text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 font-inter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Reportar descarte
            </button>

            {/* Auth */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-all font-inter"
                >
                  <div className="w-6 h-6 rounded-full bg-[#3B6D11] flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{user.email}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-inter"
                      onClick={() => setMenuOpen(false)}
                    >
                      📊 Meu dashboard
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-inter"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={handleLogin}
                className="flex items-center gap-2 border border-[#3B6D11] text-[#3B6D11] hover:bg-[#3B6D11] hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all font-inter"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
