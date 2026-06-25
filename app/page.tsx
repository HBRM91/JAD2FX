export const runtime = 'edge';
// ISR equivalent on Cloudflare: revalidate via Cache-Control set in the rates API
export const revalidate = 900;

import { fetchRates } from '@/lib/bam';
import Header from '@/app/sections/Header';
import RateTable from '@/app/sections/RateTable';
import CurrencyConverter from '@/app/sections/CurrencyConverter';
import ValueProposition from '@/app/sections/ValueProposition';
import CommentStrip from '@/app/sections/CommentStrip';
import PDFReportSection from '@/app/sections/PDFReportSection';
import ContactForm from '@/app/sections/ContactForm';
import Footer from '@/app/sections/Footer';
// Import comment.json directly — no fs.readFile (incompatible with edge runtime)
import commentData from '@/data/comment.json';

export default async function HomePage() {
  const { rates, fromCache, lastUpdated } = await fetchRates();

  return (
    <main style={{ backgroundColor: '#0A0F1E', minHeight: '100vh' }}>
      <Header />

      <RateTable
        initialRates={rates}
        lastUpdated={lastUpdated}
        fromCache={fromCache}
      />

      <ValueProposition />

      <CurrencyConverter rates={rates} />

      <CommentStrip comment={commentData} />

      <PDFReportSection />

      <div
        className="max-w-screen-2xl mx-auto px-4 md:px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      />

      <ContactForm />

      <Footer />
    </main>
  );
}
