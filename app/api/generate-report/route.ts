import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

// Rate limit: max 3 report generations per IP per hour
const _rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimit.get(ip) ?? { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  _rateLimit.set(ip, entry);
  if (_rateLimit.size > 500) {
    Array.from(_rateLimit.entries()).forEach(([k, v]) => { if (now > v.reset) _rateLimit.delete(k); });
  }
  return entry.count <= 3;
}

function sanitize(s: unknown, maxLen = 200): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function genRefId(): string {
  const d = new Date();
  return `RPT-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

function computeMetrics(amount: number, currency: string) {
  const madRates: Record<string, number> = {
    EUR: 10.92, USD: 9.95, GBP: 12.65, CHF: 11.06,
    JPY: 0.064, CAD: 7.21, SAR: 2.65, AED: 2.71,
    CNY: 1.37,  TRY: 0.27, QAR: 2.73, KWD: 32.3,
  };
  const varFactors: Record<string, number> = {
    EUR: 0.068, USD: 0.072, GBP: 0.085, CHF: 0.058, JPY: 0.092,
  };
  const madRate = madRates[currency] ?? 10.0;
  const exposureMad = amount * madRate;
  const varFactor = varFactors[currency] ?? 0.075;
  const var95 = exposureMad * varFactor;
  const var99 = var95 * 1.45;
  const es = var99 * 1.18;
  const hedgeRatio = Math.min(0.75, 0.4 + (exposureMad / 5_000_000) * 0.25);
  return { exposureMad, var95, var99, es, hedgeRatio, madRate };
}

function fmtMAD(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M MAD`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K MAD`;
  return `${n.toFixed(0)} MAD`;
}
function fmtNum(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function buildReportHtml(p: {
  company: string; currency: string; amount: number;
  serviceType: string; refId: string; date: string;
}): string {
  const m = computeMetrics(p.amount, p.currency);

  const metric = (label: string, value: string, color = '#00C896') =>
    `<td style="width:25%;padding:10px;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:4px;text-align:left;">
      <div style="font-size:10px;color:#64748B;margin-bottom:4px;">${label}</div>
      <div style="font-size:15px;font-family:monospace;font-weight:700;color:${color};">${value}</div>
    </td>`;

  const stressRow = (label: string, move: string, impact: string) =>
    `<tr>
      <td style="padding:8px 12px;color:#94A3B8;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.05);">${label}</td>
      <td style="padding:8px 12px;color:#D4A017;font-size:12px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.05);">${move}</td>
      <td style="padding:8px 12px;color:#EF4444;font-size:12px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.05);">${impact}</td>
    </tr>`;

  const fwdRow = (tenor: string, rate: number, cost: string) =>
    `<tr>
      <td style="padding:8px 12px;color:#94A3B8;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.05);">${tenor}</td>
      <td style="padding:8px 12px;color:#F1F5F9;font-size:12px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.05);">${rate.toFixed(4)} MAD/${p.currency}</td>
      <td style="padding:8px 12px;color:#64748B;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.05);">${cost}</td>
    </tr>`;

  const checkItem = (text: string, ok = true) =>
    `<div style="display:flex;gap:8px;margin-bottom:6px;">
      <span style="color:${ok ? '#22C55E' : '#64748B'};font-weight:700;min-width:16px;">${ok ? '✓' : '○'}</span>
      <span style="color:#94A3B8;font-size:12px;">${text}</span>
    </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport de Risque FX — ${p.company}</title></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:system-ui,-apple-system,sans-serif;color:#F1F5F9;">
<div style="max-width:680px;margin:0 auto;padding:0 0 40px;">

  <!-- Header -->
  <div style="background:#111827;padding:24px 32px;border-bottom:3px solid #00C896;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.04em;margin-bottom:4px;">
          JAD2<span style="color:#00C896;">FX</span>
        </div>
        <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;">RAPPORT DE RISQUE FX</div>
        <div style="font-size:15px;color:#D4A017;font-weight:700;margin-top:4px;">${p.company}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Référence</div>
        <div style="font-size:13px;font-family:monospace;color:#F1F5F9;font-weight:700;">${p.refId}</div>
        <div style="font-size:10px;color:#64748B;margin-top:6px;">${p.date}</div>
        <div style="font-size:11px;color:#00C896;margin-top:2px;">Devise: <strong>${p.currency}</strong></div>
      </div>
    </div>
  </div>

  <!-- Warning -->
  <div style="background:rgba(212,160,23,0.08);border-left:3px solid #D4A017;padding:12px 20px;margin:0;">
    <strong style="color:#D4A017;font-size:12px;">⚠ Avertissement pédagogique</strong><br>
    <span style="color:#94A3B8;font-size:11px;line-height:1.6;">
      Ce rapport est généré à titre pédagogique uniquement. Les métriques présentées sont illustratives
      et ne constituent pas un conseil en investissement. JAD2 Advisory n'est pas habilitée à fournir
      des services d'investissement au sens de la réglementation AMMC.
    </span>
  </div>

  <div style="padding:24px 32px;">

    <!-- Section 1: Exposure -->
    <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;margin-top:8px;">
      1. SNAPSHOT D'EXPOSITION
    </div>
    <table style="width:100%;border-spacing:8px;border-collapse:separate;">
      <tr>
        ${metric('Exposition brute déclarée', `${fmtNum(p.amount)} ${p.currency}`, '#F1F5F9')}
        ${metric('≈ Valeur MAD (indicative)', fmtMAD(m.exposureMad), '#00C896')}
        ${metric('Position non couverte', fmtMAD(m.exposureMad * (1 - m.hedgeRatio)), '#EF4444')}
        ${metric('Hedge ratio suggéré', `${(m.hedgeRatio * 100).toFixed(0)}%`, '#D4A017')}
      </tr>
    </table>

    <!-- Section 2: Risk metrics -->
    <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-top:20px;margin-bottom:12px;">
      2. MÉTRIQUES DE RISQUE ILLUSTRATIVES (10 jours)
    </div>
    <table style="width:100%;border-spacing:8px;border-collapse:separate;">
      <tr>
        ${metric('VaR 95%', fmtMAD(m.var95), '#D4A017')}
        ${metric('VaR 99%', fmtMAD(m.var99), '#EF4444')}
        ${metric('Expected Shortfall', fmtMAD(m.es), '#EF4444')}
        ${metric('Cours central', `${m.madRate.toFixed(4)} MAD/${p.currency}`, '#94A3B8')}
      </tr>
    </table>

    <!-- Section 3: Stress test -->
    <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-top:20px;margin-bottom:12px;">
      3. STRESS TESTING — SCÉNARIOS HISTORIQUES
    </div>
    <table style="width:100%;background:#111827;border-radius:4px;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">Scénario</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">Mouvement</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">Impact MAD</th>
        </tr>
      </thead>
      <tbody>
        ${stressRow('Crise financière 2008', '+8.2%', fmtMAD(m.exposureMad * 0.082))}
        ${stressRow('Pandémie COVID-19 2020', '+5.4%', fmtMAD(m.exposureMad * 0.054))}
        ${stressRow('Choc inflation USD 2022', '+6.8%', fmtMAD(m.exposureMad * 0.068))}
        ${stressRow('Dévaluation MAD –5%', '–5.0%', fmtMAD(m.exposureMad * 0.050))}
        ${stressRow('Choc extrême (tail risk)', '+12.0%', fmtMAD(m.exposureMad * 0.120))}
      </tbody>
    </table>

    <!-- Section 4: Forward curve -->
    <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-top:20px;margin-bottom:12px;">
      4. COURBE FORWARD — INDICATIVE
    </div>
    <table style="width:100%;background:#111827;border-radius:4px;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">Échéance</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">Cours forward</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">Coût de couverture</th>
        </tr>
      </thead>
      <tbody>
        ${fwdRow('30 jours', m.madRate * 1.002, '~0.2%')}
        ${fwdRow('90 jours', m.madRate * 1.005, '~0.5%')}
        ${fwdRow('180 jours', m.madRate * 1.009, '~0.9%')}
        ${fwdRow('360 jours', m.madRate * 1.015, '~1.5%')}
      </tbody>
    </table>

    <!-- Section 5: Compliance -->
    <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-top:20px;margin-bottom:12px;">
      5. CONFORMITÉ — OFFICE DES CHANGES
    </div>
    <div style="background:#111827;border-radius:4px;padding:16px;">
      ${checkItem('Déclaration statistique BKAM requise si exposition > 1M MAD')}
      ${checkItem('Justificatifs commerciaux pour opérations import/export')}
      ${checkItem('Règles de rapatriement des recettes d\'exportation')}
      ${checkItem('Plafonds de couverture par anticipation (Office des Changes)')}
      ${checkItem('Reporting position de change', m.exposureMad > 5_000_000)}
    </div>

    <!-- CTA -->
    <div style="background:rgba(0,200,150,0.06);border:1px solid rgba(0,200,150,0.2);border-radius:6px;padding:20px;margin-top:24px;">
      <div style="font-size:14px;font-weight:700;color:#00C896;margin-bottom:8px;">PROCHAINES ÉTAPES — JAD2 ADVISORY</div>
      <p style="color:#94A3B8;font-size:12px;line-height:1.7;margin:0 0 12px;">
        Ce rapport révèle une exposition FX estimée de <strong style="color:#D4A017">${fmtMAD(m.exposureMad)}</strong> en ${p.currency}/MAD.
        JAD2 Advisory peut vous accompagner pour : audit détaillé, structuration d'une politique de couverture,
        formation des équipes, conformité Office des Changes et automatisation du reporting de positions FX.
      </p>
      <a href="mailto:contact@jad2advisory.com" style="display:inline-block;background:#00C896;color:#0A0F1E;padding:10px 20px;border-radius:4px;font-size:13px;font-weight:700;text-decoration:none;">
        Contacter JAD2 Advisory →
      </a>
      <div style="color:#64748B;font-size:11px;margin-top:10px;">jad2advisory.com · contact@jad2advisory.com · Casablanca, Maroc</div>
    </div>

    <!-- Disclaimer -->
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="color:#374151;font-size:10px;line-height:1.6;">
        Ce rapport est généré à titre pédagogique uniquement. Les métriques VaR, Expected Shortfall et les cours forward
        présentés sont estimatifs et basés sur des données indicatives. Ils ne constituent pas un conseil en investissement,
        une recommandation de couverture, ni une offre de service financier. JAD2 Advisory n'est pas habilitée à fournir des
        services d'investissement au sens de la réglementation AMMC. Pour toute opération de change, adressez-vous à un
        établissement de crédit agréé par Bank Al-Maghrib. © JAD2 Advisory ${new Date().getFullYear()} · Réf: ${p.refId}
      </p>
    </div>

  </div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Limite de génération atteinte. Réessayez dans une heure.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const company     = sanitize(body.company);
  const email       = sanitize(body.email, 200);
  const currency    = sanitize(body.currency, 5);
  const serviceType = sanitize(body.serviceType);
  const amountRaw   = typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount ?? '0'));
  const amount      = isNaN(amountRaw) || amountRaw < 0 ? 0 : Math.min(amountRaw, 1e12);

  if (!company || !email || !email.includes('@')) {
    return NextResponse.json({ error: 'Entreprise et email valides requis' }, { status: 400 });
  }

  const VALID_CURRENCIES = ['EUR','USD','GBP','CHF','JPY','CAD','SAR','AED','CNY','TRY','QAR','KWD'];
  const curr = VALID_CURRENCIES.includes(currency) ? currency : 'EUR';
  const refId = genRefId();
  const date  = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const reportHtml = buildReportHtml({ company, currency: curr, amount, serviceType, refId, date });

  const toEmail   = process.env.RESEND_TO_EMAIL ?? 'contact@jad2advisory.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@jad2fx.jad2advisory.com';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');

    await resend.emails.send({
      from: fromEmail,
      to: [email],
      bcc: [toEmail],
      reply_to: toEmail,
      subject: `[JAD2FX] Votre rapport de risque FX — ${company} · ${refId}`,
      html: reportHtml,
    });

    return NextResponse.json({ success: true, refId });
  } catch (err) {
    console.error('Report send error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez.' }, { status: 500 });
  }
}
