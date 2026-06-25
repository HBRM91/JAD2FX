import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'JAD2FX — Taux de Change MAD | Données Bank Al-Maghrib',
  description:
    'Consultez les taux de change indicatifs du dirham marocain (MAD) publiés par Bank Al-Maghrib. Terminal de données FX de JAD2 Advisory — Casablanca, Maroc.',
  keywords: [
    'taux de change MAD',
    'dirham marocain',
    'EUR MAD',
    'USD MAD',
    'Bank Al-Maghrib',
    'BKAM',
    'taux de change Maroc',
    'forex Maroc',
    'JAD2 Advisory',
    'risque de change',
  ],
  authors: [{ name: 'JAD2 Advisory', url: 'https://jad2advisory.com' }],
  creator: 'JAD2 Advisory',
  publisher: 'JAD2 Advisory',
  metadataBase: new URL('https://jad2fx.jad2advisory.com'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://jad2fx.jad2advisory.com',
    siteName: 'JAD2FX',
    title: 'JAD2FX — Terminal de Change MAD',
    description:
      'Données de change indicatives · Bank Al-Maghrib · JAD2 Advisory — Casablanca',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JAD2FX — Terminal Taux de Change MAD',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JAD2FX — Terminal de Change MAD',
    description: 'Taux de change indicatifs MAD · Bank Al-Maghrib · JAD2 Advisory',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://jad2fx.jad2advisory.com',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#0A0F1E',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0F1E',
  colorScheme: 'dark',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'JAD2FX',
  url: 'https://jad2fx.jad2advisory.com',
  description: 'Terminal de taux de change indicatifs du dirham marocain',
  inLanguage: 'fr-FR',
  publisher: {
    '@type': 'Organization',
    name: 'JAD2 Advisory',
    url: 'https://jad2advisory.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Casablanca',
      addressCountry: 'MA',
    },
  },
};

import FloatingChat from '@/app/sections/FloatingChat';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Plausible Analytics — cookieless, no consent banner needed */}
        <script
          defer
          data-domain="jad2fx.jad2advisory.com"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} style={{ backgroundColor: '#0A0F1E' }}>
        {children}
        <FloatingChat />
      </body>
    </html>
  );
}
