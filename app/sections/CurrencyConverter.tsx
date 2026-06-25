'use client';

import { useState, useCallback } from 'react';
import { ArrowLeftRight, Info } from 'lucide-react';
import type { FXRate } from '@/lib/bam';
import { fmtRate } from '@/lib/utils';

interface Props {
  rates: FXRate[];
}

export default function CurrencyConverter({ rates }: Props) {
  const [amount, setAmount] = useState<string>('1000');
  const [fromCode, setFromCode] = useState('EUR');
  const [toCode] = useState('MAD');

  const selectedRate = rates.find(r => r.code === fromCode);

  const swap = useCallback(() => {
    // We only support XXX → MAD conversions (BAM indicative rates)
    // Reverse is shown as the inverse
  }, []);

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;

  const madAmount = selectedRate
    ? (parsedAmount / selectedRate.unit) * selectedRate.sellingRate
    : 0;

  const inverseRate = selectedRate
    ? selectedRate.unit / selectedRate.sellingRate
    : 0;

  const selectStyle = {
    backgroundColor: '#111827',
    color: '#F1F5F9',
    borderColor: 'rgba(255,255,255,0.1)',
  };

  return (
    <section id="converter" className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
      <div
        className="rounded border"
        style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#111827' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            Convertisseur de Devises
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
            Cours vendeur BAM — indicatif, non contractuel
          </p>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input side */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                Montant
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 text-lg font-mono rounded border bg-transparent"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#F1F5F9',
                  outlineColor: '#00C896',
                }}
                min="0"
                step="any"
                aria-label="Montant à convertir"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                Devise source
              </label>
              <select
                value={fromCode}
                onChange={e => setFromCode(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded border"
                style={selectStyle}
                aria-label="Choisir la devise source"
              >
                {rates.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.flag} {r.code} — {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <ArrowLeftRight className="w-4 h-4" style={{ color: '#64748B' }} />
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                Devise cible
              </label>
              <div
                className="px-3 py-2.5 text-sm rounded border"
                style={{ ...selectStyle, color: '#64748B' }}
              >
                🇲🇦 MAD — Dirham marocain
              </div>
            </div>
          </div>

          {/* Result side */}
          <div className="flex flex-col justify-center space-y-4">
            <div
              className="p-4 rounded border"
              style={{ borderColor: 'rgba(0,200,150,0.2)', backgroundColor: 'rgba(0,200,150,0.05)' }}
            >
              <p className="text-xs mb-1" style={{ color: '#64748B' }}>
                {parsedAmount} {fromCode} =
              </p>
              <p
                className="rate-number text-3xl font-bold"
                style={{ color: '#00C896' }}
              >
                {madAmount > 0 ? fmtRate(madAmount, 2) : '—'}
              </p>
              <p className="text-lg font-medium mt-1" style={{ color: '#94A3B8' }}>MAD</p>
            </div>

            {selectedRate && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#64748B' }}>Cours vendeur BAM utilisé</span>
                  <span className="rate-number font-medium" style={{ color: '#94A3B8' }}>
                    {selectedRate.unit} {fromCode} = {fmtRate(selectedRate.sellingRate)} MAD
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#64748B' }}>Cours inverse</span>
                  <span className="rate-number" style={{ color: '#64748B' }}>
                    1 MAD = {fmtRate(inverseRate, 4)} {fromCode}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#64748B' }}>Source</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      color: selectedRate.source === 'BAM' ? '#00C896' : '#64748B',
                      backgroundColor: selectedRate.source === 'BAM' ? 'rgba(0,200,150,0.1)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {selectedRate.source === 'BAM' ? 'BAM Officiel' : 'Estimatif'}
                  </span>
                </div>
              </div>
            )}

            <div
              className="flex gap-2 p-3 rounded border text-xs"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: '#64748B',
              }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Taux indicatif — non contractuel. Pour toute opération de change, contactez
                un établissement de crédit agréé par Bank Al-Maghrib.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
