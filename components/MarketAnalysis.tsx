import React from 'react';
import { ExternalLink } from 'lucide-react';

const MarketAnalysis: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
            <h2 className="text-3xl font-serif font-bold text-navy-900">Market Intelligence</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
                Comprehensive analysis of the Moroccan FX landscape, combining global macroeconomic factors with local liquidity conditions.
            </p>
            <div className="flex justify-center gap-2 text-xs font-bold">
                <span className="px-2 py-1 bg-navy-900 text-white rounded cursor-pointer">EN</span>
                <span className="px-2 py-1 bg-slate-200 text-slate-500 rounded cursor-pointer">FR</span>
                <span className="px-2 py-1 bg-slate-200 text-slate-500 rounded cursor-pointer">AR</span>
            </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold text-navy-900 mb-4">Executive Summary: Q3 2024</h3>
                <p className="mb-4 text-sm text-slate-700 leading-relaxed">
                    The Moroccan Dirham (MAD) has shown resilience against the USD despite global volatility. Bank Al-Maghrib's intervention remains minimal, indicating healthy interbank liquidity. The recent circular regarding service payments has increased demand for EUR in the spot market.
                </p>

                <h4 className="text-lg font-bold text-navy-800 mt-6 mb-2">Key Drivers</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                    <li><strong>Tourism Receipts:</strong> Record inflows in August provided a cushion for reserves.</li>
                    <li><strong>Energy Bill:</strong> Lower oil prices have reduced the trade deficit impact on FX reserves.</li>
                    <li><strong>Basket Dynamics:</strong> The strengthening of the Euro globally puts slight upward pressure on MAD pairs.</li>
                </ul>

                <div className="my-8 p-4 bg-slate-50 border-l-4 border-gold-500 rounded-r-lg">
                    <h5 className="font-bold text-navy-900 mb-1">Analyst Note</h5>
                    <p className="text-sm italic text-slate-600">
                        "Importers are advised to lock in forward rates for Q4 obligations as volatility is expected to rise with the US elections."
                    </p>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap gap-4">
                <a href="https://www.bkam.ma" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-navy-900 hover:text-gold-600 transition">
                    <ExternalLink size={12} /> Bank Al-Maghrib Statistics
                </a>
                <a href="https://www.oc.gov.ma" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-navy-900 hover:text-gold-600 transition">
                    <ExternalLink size={12} /> Office des Changes Circulars
                </a>
            </div>
        </div>
    </div>
  );
};

export default MarketAnalysis;
