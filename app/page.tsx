import { fetchRates } from '@/lib/bam';
import Header from '@/app/sections/Header';
import RateTable from '@/app/sections/RateTable';
import CurrencyConverter from '@/app/sections/CurrencyConverter';
import ValueProposition from '@/app/sections/ValueProposition';
import CommentStrip from '@/app/sections/CommentStrip';
import PDFReportSection from '@/app/sections/PDFReportSection';
import ContactForm from '@/app/sections/ContactForm';
import Footer from '@/app/sections/Footer';
import { readFile } from 'fs/promises';
import { join } from 'path';

// ISR: rebuild every 15 minutes
export const revalidate = 900;

interface Comment {
  date: string;
  textFr: string;
  author: string;
  tags?: string[];
}

async function getComment(): Promise<Comment | null> {
  try {
    const content = await readFile(join(process.cwd(), 'data', 'comment.json'), 'utf-8');
    return JSON.parse(content) as Comment;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [{ rates, fromCache, lastUpdated }, comment] = await Promise.all([
    fetchRates(),
    getComment(),
  ]);

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

      <CommentStrip comment={comment} />

      <PDFReportSection />

      {/* Separator */}
      <div
        className="max-w-screen-2xl mx-auto px-4 md:px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      />

      <ContactForm />

      <Footer />
    </main>
  );
}
