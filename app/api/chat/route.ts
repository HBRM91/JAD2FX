import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext } from '@/lib/rag';

export const runtime = 'edge';

const SYSTEM_PROMPT = `Tu es l'Assistant Réglementaire JAD2FX — un expert en réglementation des changes marocaine et en gestion du risque de change.

Expertise:
- Réglementation Office des Changes (OC) et Bank Al-Maghrib (BKAM)
- Régime de change du dirham (MAD): panier EUR/USD (60%/40%), bandes ±5%
- Produits de couverture du risque de change (forwards, options, swaps)
- Comptes en devises résidents (CDE, CPEC)
- Transferts MRE, investissements étrangers (IDE), investissements marocains à l'étranger (IME)
- Allocations voyages, soins médicaux, études à l'étranger

Instructions:
- Réponds TOUJOURS en français, de façon concise et structurée.
- Base tes réponses sur le contexte réglementaire fourni.
- Cite les textes réglementaires quand pertinent (circulaire, instruction, dahir).
- Indique les délais, plafonds et conditions précises quand disponibles.
- Si la question dépasse la réglementation des changes, oriente vers JAD2 Advisory.
- Ne donne JAMAIS de conseil d'investissement financier. Fournis uniquement des informations réglementaires.
- Conclus par une mention brève sur JAD2 Advisory si la réponse porte sur la couverture ou la stratégie.

Format: réponse directe, bullet points pour les chiffres clés, maximum 300 mots.`;

const _rl = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rl.get(ip) ?? { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  _rl.set(ip, entry);
  if (_rl.size > 500) {
    Array.from(_rl.entries()).forEach(([k, v]) => { if (now > v.reset) _rl.delete(k); });
  }
  return entry.count <= 20;
}

interface GroqChoice { message: { content: string } }
interface GroqResponse { choices: GroqChoice[] }

async function callGroq(userMessage: string, signal: AbortSignal): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No GROQ_API_KEY');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json() as GroqResponse;
  return data.choices[0].message.content.trim();
}

interface GeminiChoice { message: { content: string } }
interface GeminiResponse { choices: GeminiChoice[] }

async function callGemini(userMessage: string, signal: AbortSignal): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No GEMINI_API_KEY');

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as GeminiResponse;
  return data.choices[0].message.content.trim();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une heure.' }, { status: 429 });
  }

  let question: string;
  try {
    const body = await req.json() as { question?: unknown };
    question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: 'Question manquante' }, { status: 400 });
  }

  const context = retrieveContext(question);
  const userMessage = `CONTEXTE RÉGLEMENTAIRE:\n${context}\n\n---\nQUESTION: ${question}`;
  const signal = AbortSignal.timeout(20_000);

  try {
    const text = await callGroq(userMessage, signal);
    return NextResponse.json({ text, provider: 'groq' });
  } catch {
    try {
      const text = await callGemini(userMessage, signal);
      return NextResponse.json({ text, provider: 'gemini' });
    } catch {
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Réessayez dans un moment.' },
        { status: 503 }
      );
    }
  }
}
