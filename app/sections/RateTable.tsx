'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { FXRate } from '@/lib/bam';
import PulseDot from '@/app/components/PulseDot';
import SkeletonTable from '@/app/components/SkeletonTable';
import { fmtRate, fmtPercent, fmtRelativeTime, fmtTime } from '@/lib/utils';

const Sparkline = dynamic(() => import('@/app/components/Sparkline'), { ssr: false });

type SortKey = 'code' | 'sellingRate' | 'changePercent' | 'centralRate';
type SortDir = 'asc' | 'desc';
type GroupFilter = 'all' | 'major' | 'regional' | 'african';

interface Props {
  initialRates: FXRate[];
  lastUpdated: string;
  fromCache: boolean;
}

const GROUP_LABELS: Record<GroupFilter, string> = {
  all:      'Toutes',
  major:    'Majeurs',
  regional: 'Régionaux',
  african:  'Africains',
};

export default function RateTable({ initialRates, lastUpdated, fromCache }: Props) {
  const [rates, setRates] = useState<FXRate[]>(initialRates);
  const [updated, setUpdated] = useState(lastUpdated);
  const [offline, setOffline] = useState(fromCache);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [flashMap, setFlashMap] = useState<Map<string, 'green' | 'red'>>(new Map());
  const prevRates = useRef<Map<string, number>>(new Map());

  // Client-side refresh every 15 minutes
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/rates');
      if (!res.ok) return;
      const data = await res.json();
      if (data.rates && Array.isArray(data.rates)) {
        const newFlash = new Map<string, 'green' | 'red'>();
        data.rates.forEach((r: FXRate) => {
          const prev = prevRates.current.get(r.code);
          if (prev !== undefined && r.sellingRate !== prev) {
            newFlash.set(r.code, r.sellingRate > prev ? 'green' : 'red');
          }
          prevRates.current.set(r.code, r.sellingRate);
        });
        setFlashMap(newFlash);
        setRates(data.rates);
        setUpdated(data.lastUpdated);
        setOffline(data.fromCache);
        // Clear flashes after animation
        setTimeout(() => setFlashMap(new Map()), 900);
      }
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    // Initialize prevRates
    initialRates.forEach(r => prevRates.current.set(r.code, r.sellingRate));
    const interval = setInterval(refresh, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh, initialRates]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = rates
    .filter(r => {
      const q = search.toLowerCase();
      const matchesSearch = !q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
      const matchesGroup = groupFilter === 'all' || r.group === groupFilter;
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'code')         cmp = a.code.localeCompare(b.code);
      else if (sortKey === 'sellingRate') cmp = a.sellingRate - b.sellingRate;
      else if (sortKey === 'changePercent') cmp = a.changePercent - b.changePercent;
      else if (sortKey === 'centralRate')   cmp = a.centralRate - b.centralRate;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3" style={{ color: '#00C896' }} />
      : <ArrowDown className="w-3 h-3" style={{ color: '#00C896' }} />;
  };

  const thBase = 'py-2.5 px-3 text-left text-2xs font-semibold uppercase tracking-wider whitespace-nowrap select-none';
  const thStyle = { color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.08)' };

  return (
    <section id="rates" className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
            Taux de Change MAD
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
            Source : Bank Al-Maghrib — taux indicatifs uniquement, non contractuels
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#64748B' }}>
          <PulseDot active={!offline} />
          <span>
            {offline ? (
              <span style={{ color: '#EF4444' }} className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Cache · BAM indisponible
              </span>
            ) : (
              <>Mis à jour: {fmtTime(updated)} · {fmtRelativeTime(updated)}</>
            )}
          </span>
          <button
            onClick={refresh}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="Actualiser"
            aria-label="Actualiser les taux"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Rechercher (EUR, dollar...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded border bg-transparent"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#F1F5F9',
              outlineColor: '#00C896',
            }}
          />
        </div>
        <div className="flex gap-1.5">
          {(Object.entries(GROUP_LABELS) as [GroupFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setGroupFilter(key)}
              className="px-3 py-1.5 text-xs font-medium rounded-sm border transition-all"
              style={{
                borderColor: groupFilter === key ? '#00C896' : 'rgba(255,255,255,0.1)',
                color: groupFilter === key ? '#00C896' : '#94A3B8',
                backgroundColor: groupFilter === key ? 'rgba(0,200,150,0.08)' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <SkeletonTable />
      ) : (
        <div className="table-scroll-container rounded border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <table className="w-full border-collapse min-w-[700px]" aria-label="Taux de change MAD">
            <thead style={{ backgroundColor: '#111827' }}>
              <tr>
                {/* Devise — sticky on mobile */}
                <th
                  scope="col"
                  className={`${thBase} sticky left-0 z-10 cursor-pointer`}
                  style={{ ...thStyle, minWidth: 160, backgroundColor: '#111827' }}
                  onClick={() => handleSort('code')}
                  aria-sort={sortKey === 'code' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Devise <SortIcon col="code" />
                  </div>
                </th>
                <th scope="col" className={thBase} style={{ ...thStyle, width: 60 }}>Unité</th>
                <th
                  scope="col"
                  className={`${thBase} cursor-pointer`}
                  style={{ ...thStyle, width: 120 }}
                  onClick={() => handleSort('centralRate')}
                >
                  <div className="flex items-center gap-1">
                    Cours Central <SortIcon col="centralRate" />
                  </div>
                </th>
                <th scope="col" className={thBase} style={{ ...thStyle, width: 120 }}>Acheteur</th>
                <th
                  scope="col"
                  className={`${thBase} cursor-pointer`}
                  style={{ ...thStyle, width: 120 }}
                  onClick={() => handleSort('sellingRate')}
                >
                  <div className="flex items-center gap-1">
                    Vendeur <SortIcon col="sellingRate" />
                  </div>
                </th>
                <th
                  scope="col"
                  className={`${thBase} cursor-pointer`}
                  style={{ ...thStyle, width: 100 }}
                  onClick={() => handleSort('changePercent')}
                >
                  <div className="flex items-center gap-1">
                    Var % <SortIcon col="changePercent" />
                  </div>
                </th>
                <th scope="col" className={thBase} style={{ ...thStyle, width: 100 }}>Var abs.</th>
                <th
                  scope="col"
                  className={`${thBase} hidden md:table-cell`}
                  style={{ ...thStyle, width: 80 }}
                >
                  7j
                </th>
                <th scope="col" className={thBase} style={{ ...thStyle, width: 40 }}>
                  <span className="sr-only">Tendance</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rate, idx) => {
                const isPositive = rate.changePercent >= 0;
                const flash = flashMap.get(rate.code);
                const rowBg = flash === 'green'
                  ? 'animate-flash-green'
                  : flash === 'red'
                  ? 'animate-flash-red'
                  : '';

                return (
                  <tr
                    key={rate.code}
                    className={`group transition-colors ${rowBg}`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1E293B')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    {/* Devise — sticky col */}
                    <td
                      className="py-3 px-3 sticky left-0 z-10"
                      style={{ backgroundColor: idx % 2 === 0 ? '#0A0F1E' : '#0C1120' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base" aria-hidden="true">{rate.flag}</span>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                            {rate.code}
                          </div>
                          <div className="text-2xs" style={{ color: '#64748B' }}>
                            {rate.name}
                          </div>
                        </div>
                        {rate.source !== 'BAM' && (
                          <span
                            className="text-2xs px-1 rounded"
                            style={{ color: '#64748B', backgroundColor: 'rgba(255,255,255,0.05)' }}
                            title={rate.source === 'CALCULATED' ? 'Taux croisé calculé' : 'Taux indicatif statique'}
                          >
                            {rate.source === 'CALCULATED' ? 'X' : '~'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Unité */}
                    <td className="py-3 px-3 text-right">
                      <span className="rate-number text-xs" style={{ color: '#64748B' }}>
                        {rate.unit}
                      </span>
                    </td>

                    {/* Cours Central */}
                    <td className="py-3 px-3 text-right">
                      <span className="rate-number text-sm" style={{ color: '#94A3B8' }}>
                        {fmtRate(rate.centralRate)}
                      </span>
                    </td>

                    {/* Acheteur */}
                    <td className="py-3 px-3 text-right">
                      <span className="rate-number text-sm" style={{ color: '#64748B' }}>
                        {fmtRate(rate.buyingRate)}
                      </span>
                    </td>

                    {/* Vendeur */}
                    <td className="py-3 px-3 text-right">
                      <span className="rate-number text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                        {fmtRate(rate.sellingRate)}
                      </span>
                    </td>

                    {/* Var % */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className="rate-number text-sm font-medium px-1.5 py-0.5 rounded-sm"
                        style={{
                          color: isPositive ? '#22C55E' : '#EF4444',
                          backgroundColor: isPositive
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(239,68,68,0.12)',
                        }}
                      >
                        {isPositive ? '▲' : '▼'} {Math.abs(rate.changePercent).toFixed(2)}%
                      </span>
                    </td>

                    {/* Var abs */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className="rate-number text-xs"
                        style={{ color: isPositive ? '#22C55E' : '#EF4444' }}
                      >
                        {isPositive ? '+' : ''}{rate.changeAbsolute.toFixed(4)}
                      </span>
                    </td>

                    {/* Sparkline */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <Sparkline data={rate.sparklineData} positive={isPositive} />
                    </td>

                    {/* Tendance icon */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className="text-xs"
                        style={{ color: isPositive ? '#22C55E' : rate.changePercent < -0.1 ? '#EF4444' : '#64748B' }}
                        aria-label={isPositive ? 'Hausse' : 'Baisse'}
                      >
                        {rate.changePercent > 0.05 ? '▲' : rate.changePercent < -0.05 ? '▼' : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-2xs font-mono" style={{ color: '#374151' }}>
        {filtered.length} devise{filtered.length > 1 ? 's' : ''} · BAM: taux officiels · X: croisé · ~: indicatif
      </p>
    </section>
  );
}
