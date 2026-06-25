import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import { buildReport } from '@/lib/pdf-template';

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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
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

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
    // Build React element — no JSX in route files
    const doc = buildReport({ company, currency: curr, amount, serviceType, refId, date });

    // Render to PDF buffer
    const pdfBuffer = await renderToBuffer(doc);

    const toEmail  = process.env.RESEND_TO_EMAIL ?? 'contact@jad2advisory.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@jad2fx.jad2advisory.com';

    // Send PDF to user + BCC JAD2
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      bcc: [toEmail],
      reply_to: toEmail,
      subject: `[JAD2FX] Votre rapport de risque FX — ${company} · ${refId}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; background:#0A0F1E; color:#F1F5F9; padding:32px; border-radius:8px;">
          <div style="font-size:20px; font-weight:bold; margin-bottom:8px;">
            JAD2<span style="color:#00C896">FX</span>
          </div>
          <h2 style="color:#F1F5F9; font-size:16px; margin:0 0 16px;">Votre rapport de risque FX est prêt</h2>
          <p style="color:#94A3B8; font-size:14px; line-height:1.6; margin:0 0 20px;">
            Bonjour,<br/><br/>
            Veuillez trouver en pièce jointe votre rapport de risque de change pour <strong style="color:#D4A017">${company}</strong>,
            généré par JAD2FX en date du ${date}.<br/><br/>
            Ce rapport est pédagogique et ne constitue pas un conseil en investissement.
          </p>
          <div style="background:#111827; border-radius:4px; padding:16px; margin-bottom:20px; border-left:3px solid #D4A017;">
            <div style="color:#64748B; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Référence</div>
            <div style="color:#D4A017; font-size:14px; font-weight:bold; margin-top:4px;">${refId}</div>
          </div>
          <p style="color:#94A3B8; font-size:13px; line-height:1.6; margin:0 0 24px;">
            Pour un audit complet de votre exposition FX, une formation ou un accompagnement réglementaire,
            contactez notre équipe :
          </p>
          <a href="mailto:${toEmail}" style="display:inline-block; background:#00C896; color:#0A0F1E; padding:10px 20px; border-radius:4px; font-size:13px; font-weight:600; text-decoration:none;">
            Contacter JAD2 Advisory →
          </a>
          <p style="color:#374151; font-size:11px; margin-top:24px; line-height:1.6;">
            JAD2 Advisory — Conseil & Formation en marchés financiers · Casablanca, Maroc<br/>
            JAD2 Advisory n'est pas habilitée à fournir des services d'investissement au sens de la réglementation AMMC.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `JAD2FX-RapportFX-${company.replace(/[^a-zA-Z0-9]/g, '-')}-${refId}.pdf`,
          content: Buffer.from(pdfBuffer).toString('base64'),
        },
      ],
    });

    return NextResponse.json({ success: true, refId });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport. Réessayez.' },
      { status: 500 }
    );
  }
}
