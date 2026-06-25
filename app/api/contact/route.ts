import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Simple rate limiting: max 5 contact submissions per IP per hour
const _rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimit.get(ip) ?? { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  _rateLimit.set(ip, entry);
  // Prune
  if (_rateLimit.size > 1000) {
    Array.from(_rateLimit.entries()).forEach(([k, v]) => { if (now > v.reset) _rateLimit.delete(k); });
  }
  return entry.count <= 5;
}

function sanitize(s: unknown, maxLen = 500): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une heure.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const name        = sanitize(body.name);
  const email       = sanitize(body.email, 200);
  const company     = sanitize(body.company);
  const phone       = sanitize(body.phone, 30);
  const serviceType = sanitize(body.serviceType);
  const message     = sanitize(body.message, 2000);

  if (!name || !email || !email.includes('@')) {
    return NextResponse.json({ error: 'Nom et email valides requis' }, { status: 400 });
  }

  const toEmail = process.env.RESEND_TO_EMAIL ?? 'contact@jad2advisory.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@jad2fx.jad2advisory.com';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `[JAD2FX] Nouveau message — ${serviceType} · ${name}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; color: #1f2937;">
          <div style="background: #0A0F1E; color: #F1F5F9; padding: 16px 20px; border-radius: 6px 6px 0 0;">
            <strong>JAD2FX — Nouveau message entrant</strong>
          </div>
          <div style="background: #111827; color: #94A3B8; padding: 20px; border-radius: 0 0 6px 6px;">
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:6px 0; color:#64748B; width:140px;">Nom</td><td style="padding:6px 0; color:#F1F5F9;">${name}</td></tr>
              <tr><td style="padding:6px 0; color:#64748B;">Email</td><td style="padding:6px 0; color:#F1F5F9;"><a href="mailto:${email}" style="color:#00C896;">${email}</a></td></tr>
              ${company ? `<tr><td style="padding:6px 0; color:#64748B;">Entreprise</td><td style="padding:6px 0; color:#F1F5F9;">${company}</td></tr>` : ''}
              ${phone ? `<tr><td style="padding:6px 0; color:#64748B;">Téléphone</td><td style="padding:6px 0; color:#F1F5F9;">${phone}</td></tr>` : ''}
              <tr><td style="padding:6px 0; color:#64748B;">Service</td><td style="padding:6px 0; color:#D4A017;">${serviceType}</td></tr>
            </table>
            ${message ? `<div style="margin-top:16px; padding:12px; background:#0A0F1E; border-radius:4px; color:#94A3B8; font-size:14px;">${message}</div>` : ''}
            <p style="margin-top:16px; font-size:12px; color:#374151;">Envoyé depuis jad2fx.jad2advisory.com · ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez.' }, { status: 500 });
  }
}
