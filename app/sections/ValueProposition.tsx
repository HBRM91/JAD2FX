import { CheckCircle2 } from 'lucide-react';

const PROPS = [
  {
    title: 'Données BAM en temps réel',
    detail: 'Taux actualisés toutes les 15 minutes depuis Bank Al-Maghrib',
  },
  {
    title: 'Conformité Office des Changes',
    detail: 'Aligné sur la réglementation des changes marocaine',
  },
  {
    title: 'Expertise JAD2 Advisory',
    detail: 'Conseil & formation en gestion du risque de change',
  },
];

export default function ValueProposition() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-px rounded overflow-hidden border"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {PROPS.map((p, i) => (
          <div
            key={i}
            className="p-5 flex gap-3"
            style={{ backgroundColor: '#111827', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : undefined }}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#00C896' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{p.title}</p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>{p.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
