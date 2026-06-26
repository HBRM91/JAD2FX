import React, { useState, useMemo } from 'react';
import { Globe, CheckCircle, AlertTriangle, XCircle, Download, ChevronRight } from 'lucide-react';

// ─── Scoring engine (pure client-side lookup table) ───────────────────────────

interface Inputs {
  jurisdiction: string;
  volume: string;
  currencies: string[];
  license: string[];
  segment: string;
  integration: string;
}

interface ScoreOutput {
  score: number;
  label: string;
  color: string;
  messages: Array<{ type: 'ok' | 'warn' | 'block'; text: string }>;
  annualFxCost: string;
  timeline: string;
  steps: string[];
}

const VOLUME_VALUES: Record<string, number> = {
  lt50: 50000,
  '50_250': 150000,
  '250_1M': 600000,
  gt1M: 2000000,
};

function computeCorridor(i: Inputs): ScoreOutput {
  const vol = VOLUME_VALUES[i.volume] ?? 0;
  const hasLicense = i.license.some(l => ['emi', 'pi', 'spi'].includes(l));
  const isBidirectional = i.jurisdiction && true;
  const msgs: ScoreOutput['messages'] = [];
  let score = 5;

  if (hasLicense && vol > 250000) {
    score = 9;
    msgs.push({ type: 'ok', text: 'Licence EMI/PI détectée + volume significatif : viabilité élevée. Prochaine étape : partenaire bancaire local (Attijariwafa, BMCE, CIH).' });
  } else if (hasLicense && vol <= 250000) {
    score = 7;
    msgs.push({ type: 'ok', text: 'Licence valide. Volume modéré — modèle viable avec un partenaire bancaire local de Tier-2.' });
  } else if (!hasLicense && vol > 250000) {
    score = 3;
    msgs.push({ type: 'block', text: 'Bloquant réglementaire : sans licence EMI ou PI, les fonds clients ne peuvent être détenus ni les flux MAD exécutés légalement. Délai licence BAM : 12–18 mois.' });
  } else {
    score = 4;
    msgs.push({ type: 'warn', text: 'Volume faible et absence de licence : corridor viable à petite échelle uniquement via un partenaire bancaire local sous-traitant le clearing.' });
  }

  if (i.segment === 'b2c_remittance') {
    msgs.push({ type: 'warn', text: 'B2C remittance : marché très concurrentiel (Wise, WorldRemit, MoneyGram). Différenciez sur B2B treasury ou white-label.' });
    score = Math.max(score - 1, 1);
  }

  if (i.currencies.includes('mad') && hasLicense) {
    msgs.push({ type: 'ok', text: 'Règlement en MAD possible via correspondant bancaire agréé BAM. Condition : compte nostro MAD auprès d\'une banque marocaine.' });
  }

  if (i.integration === 'digital') {
    msgs.push({ type: 'ok', text: 'Intégration numérique : les principales banques marocaines (Attijariwafa, BMCE) supportent les standards SWIFT MT103/MT202 et SEPA pour les flux transfrontaliers.' });
  }

  if (i.jurisdiction === 'us') {
    msgs.push({ type: 'warn', text: 'Juridiction US : les opérateurs US opérant en MAD doivent également respecter les obligations FinCEN et les contrôles OFAC sur les transferts vers le Maroc.' });
  }

  const annualFxCost = vol > 0
    ? `~€${Math.round(vol * 12 * 0.006).toLocaleString('fr')} / an`
    : '—';

  const timeline = !hasLicense ? '12–18 mois (obtention licence)' : vol > 1000000 ? '3–6 mois' : '1–3 mois';

  const steps = hasLicense
    ? ['Identifier un partenaire bancaire local agréé BAM', 'Négocier un accord de correspondant banking', 'Obtenir l\'approbation Office des Changes pour l\'ouverture de compte nostro MAD', 'Configurer les flux SWIFT MT103 / fichiers SEPA', 'Tests de bout en bout + go-live']
    : ['Dépôt de dossier de licence EMI/PI (ACPR ou BaFin selon juridiction)', 'Notification à Bank Al-Maghrib (si volumes > seuil réglementaire)', 'Sélection partenaire bancaire local', 'Mise en place infrastructure de clearing', 'Go-live progressif'];

  const label = score >= 8 ? 'Viabilité Élevée' : score >= 6 ? 'Viable avec Préparation' : score >= 4 ? 'Obstacles Significatifs' : 'Bloquant Réglementaire';
  const color = score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-gold-400' : score >= 4 ? 'text-amber-400' : 'text-red-400';

  return { score, label, color, messages: msgs, annualFxCost, timeline, steps };
}

function printCorridorReport(i: Inputs, r: ScoreOutput) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>Corridor Viability — JAD2FX</title>
  <style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#1a1a2e;font-size:13px}
  h1{font-size:20px;font-weight:700;border-bottom:2px solid #D4AF37;padding-bottom:8px}
  h2{font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;margin-top:20px}
  .score{font-size:56px;font-weight:900}
  .footer{margin-top:32px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;padding-top:12px}</style></head><body>
  <h1>Morocco FX Corridor Viability Scorecard</h1>
  <p style="color:#64748b">Généré par JAD2FX · ${new Date().toLocaleDateString('fr')} · JAD2 Advisory</p>
  <div class="score" style="color:${r.score>=8?'#16a34a':r.score>=6?'#d97706':'#dc2626'}">${r.score}/10</div>
  <p><strong>${r.label}</strong></p>
  <h2>Paramètres</h2>
  <ul><li>Juridiction : ${i.jurisdiction}</li><li>Volume mensuel : ${i.volume}</li>
  <li>Licences : ${i.license.join(', ') || 'Aucune'}</li><li>Segment : ${i.segment}</li></ul>
  <h2>Coût FX estimé</h2><p>${r.annualFxCost} (estimation à 60 bps de spread moyen)</p>
  <h2>Time-to-Market</h2><p>${r.timeline}</p>
  <h2>Analyse</h2>
  ${r.messages.map(m => `<p>${m.type==='ok'?'✅':m.type==='warn'?'⚠️':'❌'} ${m.text}</p>`).join('')}
  <h2>Roadmap</h2><ol>${r.steps.map(s=>`<li>${s}</li>`).join('')}</ol>
  <div class="footer">JAD2 Advisory — Cabinet de conseil en management (non établissement financier agréé BAM).
  Ce document est fourni à titre informatif. Loi n° 43-12. fx.jad2advisory.com</div>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CorridorCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
    jurisdiction: '', volume: '', currencies: [], license: [], segment: '', integration: '',
  });
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const ready = inputs.jurisdiction && inputs.volume && inputs.segment && inputs.integration
    && (showResult ? true : email && consent);

  const result = useMemo(() => showResult ? computeCorridor(inputs) : null, [inputs, showResult]);

  const toggle = (field: 'currencies' | 'license', val: string) => {
    setInputs(p => ({
      ...p,
      [field]: p[field].includes(val) ? p[field].filter(v => v !== val) : [...p[field], val],
    }));
  };

  const sel = (field: keyof Inputs, val: string) => setInputs(p => ({ ...p, [field]: val }));

  const inputCls = (active: boolean) =>
    `px-3 py-2.5 rounded-xl border text-left text-[12px] transition-all cursor-pointer ${
      active ? 'border-blue-600/60 bg-blue-500/10 text-white' : 'border-navy-700 text-slate-300 hover:border-navy-600 hover:bg-navy-800/40'
    }`;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-navy-900 border border-blue-700/30 rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} className="text-blue-400" />
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded">
              Lead Magnet 2 — European Fintech
            </span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white mb-1">
            Morocco FX Corridor Viability Scorecard
          </h1>
          <p className="text-sm text-slate-400">
            Morocco market entry readiness · 90 seconds · PDF scorecard · Zero commitment
          </p>
        </div>
      </div>

      {/* Form */}
      {!showResult && (
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5">

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Home jurisdiction</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[['uk','🇬🇧 UK'],['eu','🇪🇺 EU (SEPA)'],['us','🇺🇸 USA'],['other','🌍 Other']].map(([v,l]) => (
                <button key={v} onClick={() => sel('jurisdiction', v)} className={inputCls(inputs.jurisdiction===v)}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Monthly transaction volume</p>
            <div className="grid grid-cols-2 gap-2">
              {[['lt50','< €50K'],['50_250','€50K – €250K'],['250_1M','€250K – €1M'],['gt1M','> €1M']].map(([v,l]) => (
                <button key={v} onClick={() => sel('volume', v)} className={inputCls(inputs.volume===v)}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Regulatory license held (multi-select)</p>
            <div className="grid grid-cols-2 gap-2">
              {[['emi','EMI'],['pi','PI'],['spi','Small PI'],['none','No license yet'],['applying','Applying']].map(([v,l]) => (
                <button key={v} onClick={() => toggle('license', v)}
                  className={`${inputCls(inputs.license.includes(v))} flex items-center gap-2`}>
                  <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${inputs.license.includes(v)?'bg-blue-500 border-blue-500':'border-navy-600'}`}>
                    {inputs.license.includes(v) && <CheckCircle size={9} className="text-white" />}
                  </div>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Target client segment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[['b2b','B2B cross-border payments'],['b2c_remittance','B2C remittance'],['marketplace','Marketplace payouts'],['treasury','Treasury-as-a-Service']].map(([v,l]) => (
                <button key={v} onClick={() => sel('segment', v)} className={inputCls(inputs.segment===v)}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Integration preference</p>
            <div className="grid grid-cols-2 gap-2">
              {[['digital','Digital (SWIFT/SEPA)'],['file','File-based (SFTP)'],['hybrid','Hybrid'],['undecided','Undecided']].map(([v,l]) => (
                <button key={v} onClick={() => sel('integration', v)} className={inputCls(inputs.integration===v)}>{l}</button>
              ))}
            </div>
          </div>

          {/* Email gate */}
          <div className="pt-2 border-t border-navy-800 space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@company.eu"
              className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 flex-shrink-0 accent-blue-500" />
              <span className="text-[9px] text-slate-600 leading-relaxed">
                I agree JAD2 Advisory may contact me about this assessment. GDPR Art. 6(1)(a). Withdraw: contact@jad2advisory.com.
              </span>
            </label>
            <button
              onClick={() => { if (ready) setShowResult(true); }}
              disabled={!ready}
              className="w-full py-3 bg-blue-500 text-white font-bold text-sm rounded-xl hover:bg-blue-400 disabled:opacity-40 transition-colors">
              Get my Corridor Scorecard →
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {showResult && result && (
        <div className="space-y-4">
          <div className="bg-navy-900 border border-blue-700/30 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Corridor Viability Score</p>
                <p className={`text-5xl font-mono font-black ${result.color}`}>{result.score}<span className="text-2xl text-slate-600">/10</span></p>
                <p className={`text-sm font-bold mt-1 ${result.color}`}>{result.label}</p>
              </div>
              <button onClick={() => printCorridorReport(inputs, result)}
                className="flex items-center gap-2 px-4 py-2 border border-navy-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors">
                <Download size={13} /> PDF Scorecard
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Annual FX cost est.', value: result.annualFxCost },
                { label: 'Time-to-market', value: result.timeline },
              ].map(m => (
                <div key={m.label} className="bg-navy-800 rounded-lg px-3 py-2.5">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-sm font-mono font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              {result.messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg border flex items-start gap-2 ${
                  m.type==='ok' ? 'bg-emerald-500/8 border-emerald-700/40' :
                  m.type==='warn' ? 'bg-amber-500/8 border-amber-700/40' :
                  'bg-red-500/8 border-red-700/40'
                }`}>
                  {m.type==='ok' ? <CheckCircle size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" /> :
                   m.type==='warn' ? <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" /> :
                   <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />}
                  <p className="text-[12px] text-slate-300 leading-snug">{m.text}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Regulatory Roadmap</p>
              <div className="space-y-1.5">
                {result.steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[12px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-600/25 rounded-xl p-5">
            <p className="text-sm font-bold text-white mb-1">Book a 30-min Corridor Architecture Session</p>
            <p className="text-[12px] text-slate-400 mb-3">
              JAD2 Advisory can map your specific licensing path, identify local banking partners,
              and define a compliant MAD settlement architecture.
            </p>
            <a href="mailto:contact@jad2advisory.com?subject=Morocco%20Corridor%20Architecture%20Session"
              className="inline-flex items-center gap-2 border border-blue-500/50 text-blue-300 font-bold text-sm px-5 py-2.5 rounded-lg hover:border-blue-400 hover:bg-blue-500/5 transition-colors">
              <ChevronRight size={14} /> Book with JAD2 Advisory
            </a>
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-700 text-center">
        JAD2 Advisory — Management consulting firm. Not a licensed payment institution.
        Loi n° 43-12. Scorecard for informational purposes only.
      </p>
    </div>
  );
}
