import React, { useState } from 'react';
import { DashboardTab, FairValueResult } from '../types';
import FxChart from './FxChart';
import { BANKS, MOCK_RATES_EUR, MOCK_RATES_USD } from '../constants';
import { Download, SlidersHorizontal, ArrowLeftRight, ChevronDown } from 'lucide-react';

interface Props {
  fairValue: { eurMad: FairValueResult, usdMad: FairValueResult } | null;
}

const FxDashboard: React.FC<Props> = ({ fairValue }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('VIREMENTS');
  const [selectedPair, setSelectedPair] = useState<'EUR/MAD' | 'USD/MAD'>('EUR/MAD');

  // Determine current active data
  const currentFairValue = selectedPair === 'EUR/MAD' ? fairValue?.eurMad : fairValue?.usdMad;
  const currentChartData = selectedPair === 'EUR/MAD' ? MOCK_RATES_EUR : MOCK_RATES_USD;

  const renderComparisonTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-navy-900 font-serif border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Bank Institution</th>
            <th className="px-4 py-3 text-right">Buy {selectedPair.split('/')[0]}</th>
            <th className="px-4 py-3 text-right">Sell {selectedPair.split('/')[0]}</th>
            <th className="px-4 py-3 text-right">Spread vs Fair Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {/* Fair Value Row (Benchmark) */}
          <tr className="bg-gold-50/50">
            <td className="px-4 py-3 font-bold text-navy-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-500"></div>
                Khouya Fair Value
            </td>
            <td className="px-4 py-3 text-right font-bold font-mono text-navy-900">
                {currentFairValue?.theoreticalBuy.toFixed(4) || '---'}
            </td>
            <td className="px-4 py-3 text-right font-bold font-mono text-navy-900">
                {currentFairValue?.theoreticalSell.toFixed(4) || '---'}
            </td>
            <td className="px-4 py-3 text-right text-xs text-slate-500 italic">Benchmark</td>
          </tr>
          
          {/* Mock Banks */}
          {BANKS.map((bank, i) => {
             // Mock deviation based on selected currency magnitude
             const baseMid = currentFairValue?.mid || (selectedPair === 'EUR/MAD' ? 10.8 : 9.9);
             const buy = (currentFairValue?.theoreticalBuy || baseMid - 0.1) - (Math.random() * 0.05);
             const sell = (currentFairValue?.theoreticalSell || baseMid + 0.1) + (Math.random() * 0.05);
             return (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-slate-700 font-medium">{bank}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{buy.toFixed(4)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{sell.toFixed(4)}</td>
                <td className="px-4 py-3 text-right text-red-600 text-xs font-medium">
                   +{(sell - baseMid).toFixed(3)} MAD
                </td>
              </tr>
             )
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 rounded-md p-1">
                {(['VIREMENTS', 'BILLETS', 'GLOBAL_FX'] as DashboardTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${
                            activeTab === tab 
                            ? 'bg-navy-900 text-white shadow-md' 
                            : 'text-slate-500 hover:text-navy-900 hover:bg-slate-200'
                        }`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>
            
            <div className="flex gap-2">
                <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white text-xs font-bold rounded shadow-sm hover:bg-navy-800 transition">
                        {selectedPair} <ChevronDown size={14} />
                    </button>
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded shadow-lg border border-slate-100 overflow-hidden hidden group-hover:block z-20">
                        <button 
                            onClick={() => setSelectedPair('EUR/MAD')} 
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            EUR/MAD
                        </button>
                        <button 
                            onClick={() => setSelectedPair('USD/MAD')} 
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            USD/MAD
                        </button>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-slate-50">
                    <Download size={14} /> Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-slate-50">
                    <SlidersHorizontal size={14} /> Spread
                </button>
            </div>
        </div>

        {/* Dynamic Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-serif text-lg font-bold text-navy-900">
                        {activeTab === 'GLOBAL_FX' ? 'Major Cross Rates Mid-Market' : `Comparative Rates: ${selectedPair}`}
                    </h3>
                    <span className="text-xs text-slate-400">Live Update: 10:42 AM</span>
                </div>
                {activeTab === 'GLOBAL_FX' ? (
                     <FxChart pair={selectedPair} data={currentChartData} />
                ) : renderComparisonTable()}
            </div>

            <div className="lg:col-span-1 bg-navy-900 text-white rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ArrowLeftRight size={100} />
                </div>
                
                <div>
                    <h4 className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-2">Fair Value Model</h4>
                    <div className="space-y-6 relative z-10">
                        <div className="p-3 bg-white/5 rounded border border-white/10">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-slate-300 text-xs">Selected Pair ({selectedPair})</p>
                                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                            </div>
                            <p className="text-3xl font-serif font-bold text-white">
                                {currentFairValue?.mid.toFixed(4) || '---'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">Theoretical Mid-Market</p>
                        </div>

                        <div>
                            <p className="text-slate-400 text-xs mb-1">
                                {selectedPair === 'EUR/MAD' ? 'USD/MAD' : 'EUR/MAD'} (Ref)
                            </p>
                            <p className="text-xl font-serif font-bold text-slate-500">
                                {selectedPair === 'EUR/MAD' 
                                    ? (fairValue?.usdMad.mid.toFixed(4) || '---') 
                                    : (fairValue?.eurMad.mid.toFixed(4) || '---')
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-navy-700 relative z-10">
                    <p className="text-[10px] text-slate-400 leading-normal">
                        Calculated using Official Basket Weights (60% EUR / 40% USD) + Market Spread.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FxDashboard;