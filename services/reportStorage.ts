import { MarketReport } from '../types';

function base(corsProxyUrl: string) {
  return corsProxyUrl.replace(/\/$/, '');
}

function authHeaders(passcode: string) {
  return {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${passcode}`,
  };
}

export async function getPublishedReport(corsProxyUrl: string): Promise<MarketReport | null> {
  const res = await fetch(`${base(corsProxyUrl)}/api/reports/published`);
  if (!res.ok) throw new Error(`getPublishedReport: ${res.status}`);
  return res.json();
}

export interface ReportMeta {
  id: string;
  createdAt: string;
  titleFr: string;
  isPublished: boolean;
  llmModel: string;
}

export async function listReports(corsProxyUrl: string, passcode: string): Promise<ReportMeta[]> {
  const res = await fetch(`${base(corsProxyUrl)}/api/reports`, {
    headers: authHeaders(passcode),
  });
  if (!res.ok) throw new Error(`listReports: ${res.status}`);
  return res.json();
}

export async function saveReport(
  report: MarketReport,
  corsProxyUrl: string,
  passcode: string
): Promise<string> {
  const res = await fetch(`${base(corsProxyUrl)}/api/reports`, {
    method: 'POST',
    headers: authHeaders(passcode),
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error(`saveReport: ${res.status}`);
  const data = await res.json() as { ok: boolean; id: string };
  return data.id;
}

export async function publishReport(
  id: string,
  publish: boolean,
  corsProxyUrl: string,
  passcode: string
): Promise<void> {
  const res = await fetch(`${base(corsProxyUrl)}/api/reports/${id}/publish`, {
    method: 'POST',
    headers: authHeaders(passcode),
    body: JSON.stringify({ publish }),
  });
  if (!res.ok) throw new Error(`publishReport: ${res.status}`);
}

export async function deleteReport(
  id: string,
  corsProxyUrl: string,
  passcode: string
): Promise<void> {
  const res = await fetch(`${base(corsProxyUrl)}/api/reports/${id}`, {
    method: 'DELETE',
    headers: authHeaders(passcode),
  });
  if (!res.ok) throw new Error(`deleteReport: ${res.status}`);
}
