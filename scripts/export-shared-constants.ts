/**
 * Build-time script: exports shared constants to a JSON file so the
 * Cloudflare Pages middleware (JS, not TS) can read them.
 *
 * Run:  npx tsx scripts/export-shared-constants.ts
 * Output: public/__shared_constants.json
 */
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BKAM_CURRENCIES, GULF_USD_RATES, DEFAULT_BASKET_CONFIG } from '../constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const out = {
  BKAM_CURRENCIES: BKAM_CURRENCIES.map((c) => ({
    code: c.code,
    nameFr: c.nameFr,
    flag: c.flag,
    unit: c.bkamUnit,
  })),
  GULF_USD_RATES,
  BASKET: {
    K: DEFAULT_BASKET_CONFIG.referenceBasketValue,
    EUR_W: DEFAULT_BASKET_CONFIG.eurWeight,
    USD_W: DEFAULT_BASKET_CONFIG.usdWeight,
  },
  generatedAt: new Date().toISOString(),
};

const outPath = resolve(__dirname, '..', 'public', '__shared_constants.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${BKAM_CURRENCIES.length} currencies to ${outPath}`);
