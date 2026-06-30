/**
 * P2.16 — Universal data export utility.
 * CSV (RFC 4180), XLSX (SpreadsheetML 2003 — no library), JSON.
 */

function escapeCsv(value: any): string {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv<T extends Record<string, any>>(rows: T[], columns?: (keyof T)[]): string {
  if (!rows.length) return '';
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const header = cols.join(',');
  const body = rows.map((r) => cols.map((c) => escapeCsv((r as any)[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function toXlsx<T extends Record<string, any>>(rows: T[], sheetName = 'Sheet1', columns?: (keyof T)[]): string {
  // SpreadsheetML 2003 XML — readable by Excel/LibreOffice/Numbers, no library.
  if (!rows.length) return toXlsx([{} as T], sheetName, columns);
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const xmlEscape = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cell = (v: any) => {
    const s = String(v ?? '');
    if (/^-?\d+(\.\d+)?$/.test(s)) return `<Cell><Data ss:Type="Number">${s}</Data></Cell>`;
    return `<Cell><Data ss:Type="String">${xmlEscape(s)}</Data></Cell>`;
  };
  const headerRow = `<Row>${cols.map((c) => `<Cell ss:StyleID="s1"><Data ss:Type="String">${xmlEscape(c)}</Data></Cell>`).join('')}</Row>`;
  const body = rows.map((r) => `<Row>${cols.map((c) => cell((r as any)[c])).join('')}</Row>`).join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="s1"><Font ss:Bold="1"/><Interior ss:Color="#D4AF37" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="${xmlEscape(sheetName)}"><Table>${headerRow}${body}</Table></Worksheet>
</Workbook>`;
}

function toJson<T>(rows: T[]): string {
  return JSON.stringify(rows, null, 2);
}

interface DownloadOptions {
  filename: string;
  format: 'csv' | 'xlsx' | 'json';
  bom?: boolean; // prepend UTF-8 BOM for CSV (Excel compatibility)
}

export function downloadData<T extends Record<string, any>>(rows: T[], options: DownloadOptions, columns?: (keyof T)[]): void {
  const { filename, format, bom = true } = options;
  let content: string;
  let mime: string;
  let ext: string;
  switch (format) {
    case 'csv':
      content = (bom ? '\uFEFF' : '') + toCsv(rows, columns);
      mime = 'text/csv;charset=utf-8';
      ext = 'csv';
      break;
    case 'xlsx':
      content = toXlsx(rows, filename.replace(/\.[^.]+$/, ''), columns);
      mime = 'application/vnd.ms-excel;charset=utf-8';
      ext = 'xls';
      break;
    case 'json':
      content = toJson(rows);
      mime = 'application/json;charset=utf-8';
      ext = 'json';
      break;
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/\.[^.]+$/, '')}.${ext}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);

  // P3.12 — Track export as funnel event
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('data_export', { props: { format, count: rows.length, filename } });
  }
}
