import React, { useEffect, useRef } from 'react';
import { LiveRate } from '../types';
import { BKAM_CURRENCIES } from '../constants';

interface Props {
  rates: LiveRate[];
}

const currencyMeta = Object.fromEntries(BKAM_CURRENCIES.map(c => [c.code, c]));

const RatesTicker: React.FC<Props> = ({ rates }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || rates.length === 0) return;

    // Duplicate the items for seamless loop
    track.innerHTML += track.innerHTML;

    let pos = 0;
    const speed = 0.4; // px per frame
    let rafId: number;

    const animate = () => {
      pos -= speed;
      if (pos <= -track.scrollWidth / 2) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [rates]);

  if (rates.length === 0) return null;

  return (
    <div className="bg-navy-900 border-b border-navy-800 overflow-hidden py-2">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-gold-500 text-navy-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 mr-3 z-10">
          BKAM LIVE
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div ref={trackRef} className="flex items-center gap-8 whitespace-nowrap" style={{ willChange: 'transform' }}>
            {rates.map(rate => {
              const meta = currencyMeta[rate.currency];
              return (
                <span key={rate.currency} className="flex items-center gap-2 text-xs">
                  <span>{meta?.flag}</span>
                  <span className="text-slate-400 font-medium">{rate.pair}</span>
                  <span className="text-white font-mono font-bold">{rate.mid.toFixed(4)}</span>
                  <span className="text-slate-500">|</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatesTicker;
