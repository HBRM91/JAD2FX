'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, TrendingUp } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center border-b"
      style={{
        backgroundColor: 'rgba(10,15,30,0.92)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="w-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#00C896' }} />
          <span className="font-bold text-xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            <span style={{ color: '#F1F5F9' }}>JAD2</span>
            <span style={{ color: '#00C896' }}>FX</span>
          </span>
          <span
            className="hidden md:inline text-xs font-mono ml-3"
            style={{ color: '#64748B' }}
          >
            · Données indicatives · Bank Al-Maghrib
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          <a
            href="#rates"
            className="text-sm font-medium transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Taux BAM
          </a>
          <a
            href="#converter"
            className="text-sm font-medium transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Convertisseur
          </a>
          <a
            href="#rapport"
            className="text-sm font-medium transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Rapport FX
          </a>
          <a
            href="#contact"
            className="px-4 py-2 text-sm font-semibold rounded-sm transition-all"
            style={{ backgroundColor: '#D4A017', color: '#0A0F1E' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            Auditer mon exposition →
          </a>
        </nav>

        {/* Mobile: CTA + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="#contact"
            className="px-3 py-1.5 text-xs font-semibold rounded-sm"
            style={{ backgroundColor: '#D4A017', color: '#0A0F1E' }}
          >
            Contact
          </a>
          <button
            className="p-2 rounded"
            style={{ color: '#94A3B8' }}
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="absolute top-14 left-0 right-0 border-b lg:hidden"
          style={{
            backgroundColor: '#0A0F1E',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <nav className="flex flex-col px-4 py-3 gap-1">
            {['#rates:Taux BAM', '#converter:Convertisseur', '#rapport:Rapport FX', '#contact:Contact'].map(item => {
              const [href, label] = item.split(':');
              return (
                <a
                  key={href}
                  href={href}
                  className="py-3 text-sm font-medium border-b"
                  style={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
