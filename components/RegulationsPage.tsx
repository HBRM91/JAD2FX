import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { BookOpen, ExternalLink, ChevronDown, ChevronRight, Shield, FileText, Scale, Globe } from 'lucide-react';
import { BKAM_LINKS } from '../constants/bkamLinks';

interface RegDoc {
  id: string;
  title: string;
  titleFr: string;
  titleAr: string;
  date: string;
  category: 'OC_CIRC' | 'OC_INSTR' | 'BKAM_NOTE' | 'BKAM_GUIDE';
  url: string;
  summary: string;
  summaryFr: string;
  summaryAr: string;
  tags: string[];
}

const REGULATIONS: RegDoc[] = [
  // ── Office des Changes — Circulaires ──────────────────────────────────────
  {
    id: 'circ-2017-01',
    title: 'Circular n°2017/01 — Exchange Control Regulations for Imports & Exports',
    titleFr: 'Circulaire n°2017/01 — Réglementation des Changes à l\'Import/Export',
    titleAr: 'منشور رقم 2017/01 — أحكام الصرف المتعلقة بالاستيراد والتصدير',
    date: '2017-01-01',
    category: 'OC_CIRC',
    url: 'https://www.oc.gov.ma/sites/default/files/2017-08/Circulaire_2017-01.pdf',
    summary: 'General framework for foreign exchange operations related to trade transactions — import/export repatriation obligations.',
    summaryFr: 'Cadre général des opérations de change liées aux transactions commerciales — obligations de rapatriement import/export.',
    summaryAr: 'الإطار العام لعمليات الصرف المتعلقة بالمعاملات التجارية — التزامات الإعادة للاستيراد/التصدير.',
    tags: ['import', 'export', 'rapatriement', 'commerce'],
  },
  {
    id: 'circ-2014-02',
    title: 'Circular n°2014/02 — Capital Operations and Direct Investment',
    titleFr: 'Circulaire n°2014/02 — Opérations en Capital et Investissements Directs',
    titleAr: 'منشور رقم 2014/02 — عمليات رأس المال والاستثمارات المباشرة',
    date: '2014-04-01',
    category: 'OC_CIRC',
    url: 'https://www.oc.gov.ma/sites/default/files/2017-08/Circulaire_2014-02.pdf',
    summary: 'Rules governing foreign direct investment (FDI) flows, capital transfers, and repatriation of investment income.',
    summaryFr: 'Règles régissant les flux d\'investissements directs étrangers (IDE), les transferts de capitaux et le rapatriement des revenus.',
    summaryAr: 'قواعد تنظيم تدفقات الاستثمار الأجنبي المباشر وتحويلات رأس المال وإعادة دخل الاستثمار.',
    tags: ['IDE', 'capital', 'investissement', 'rapatriement'],
  },
  {
    id: 'circ-2023-dotation',
    title: 'Circular — Travel Allowances & Personal Foreign Exchange Dotations',
    titleFr: 'Circulaire — Dotations de Voyage et Allocations de Change Personnelles',
    titleAr: 'منشور — تخصيصات السفر ومخصصات الصرف الشخصية',
    date: '2023-01-01',
    category: 'OC_CIRC',
    url: 'https://www.oc.gov.ma/fr/reglementation/voyageurs',
    summary: 'Annual travel allowances for Moroccan residents: 45,000 MAD general travel, 20,000 MAD business, student dotations.',
    summaryFr: 'Dotations annuelles pour les résidents marocains : 45 000 MAD voyages personnels, 20 000 MAD affaires, dotations étudiants.',
    summaryAr: 'المخصصات السنوية Ù„Ù„Ù…Ù‚ÙŠÙ…ÙŠÙ† المغاربة: 45,000 درهم للسفر الشخصي، 20,000 درهم للأعمال، مخصصات الطلاب.',
    tags: ['voyage', 'dotation', 'tourisme', 'allocation'],
  },
  // ── Office des Changes — Instructions ──────────────────────────────────────
  {
    id: 'instr-2023-01',
    title: 'Instruction n°01/2023 — Hedging of FX Risk by Moroccan Companies',
    titleFr: 'Instruction n°01/2023 — Couverture du Risque de Change par les Entreprises',
    titleAr: 'تعليمات رقم 01/2023 — تغطية مخاطر الصرف Ù…Ù† قبل الشركات المغربية',
    date: '2023-03-15',
    category: 'OC_INSTR',
    url: 'https://www.oc.gov.ma/fr/reglementation/entreprises/couverture-change',
    summary: 'Authorization and conditions for Moroccan companies to use FX forwards, options and swaps to hedge commercial FX risk.',
    summaryFr: 'Autorisation et conditions permettant aux entreprises marocaines d\'utiliser des forwards, options et swaps pour couvrir le risque de change commercial.',
    summaryAr: 'الترخيص والشروط التي تتيح للشركات المغربية استخدام العقود الآجلة والخيارات والمقايضات لتغطية مخاطر الصرف التجارية.',
    tags: ['couverture', 'forward', 'swap', 'option', 'entreprise'],
  },
  {
    id: 'instr-services',
    title: 'Instruction — Payments for International Services & Royalties',
    titleFr: 'Instruction — Règlement des Services Internationaux et Redevances',
    titleAr: 'تعليمات — سداد الخدمات الدولية والإتاوات',
    date: '2022-01-01',
    category: 'OC_INSTR',
    url: 'https://www.oc.gov.ma/fr/reglementation/entreprises/services',
    summary: 'Procedures and limits for outward payments for services: consulting, IT, royalties, technical assistance.',
    summaryFr: 'Procédures et plafonds pour les paiements extérieurs de services : conseil, IT, redevances, assistance technique.',
    summaryAr: 'الإجراءات والحدود لمدفوعات الخدمات الخارجية: الاستشارات وتكنولوجيا المعلومات والإتاوات والمساعدة التقنية.',
    tags: ['services', 'IT', 'redevances', 'assistance technique'],
  },
  {
    id: 'instr-dividendes',
    title: 'Instruction — Repatriation of Dividends and Investment Income',
    titleFr: 'Instruction — Rapatriement de Dividendes et Revenus de Placement',
    titleAr: 'تعليمات — إعادة توطين أرباح الأسهم ودخل الاستثمار',
    date: '2021-06-01',
    category: 'OC_INSTR',
    url: 'https://www.oc.gov.ma/fr/reglementation/entreprises/dividendes',
    summary: 'Conditions for transferring dividends, interest and profits from Morocco abroad by foreign investors.',
    summaryFr: 'Conditions de transfert de dividendes, intérêts et bénéfices depuis le Maroc vers l\'étranger par les investisseurs étrangers.',
    summaryAr: 'شروط تحويل أرباح الأسهم والفوائد والأرباح Ù…Ù† المغرب إلى الخارج Ù…Ù† قبل المستثمرين الأجانب.',
    tags: ['dividendes', 'IDE', 'transfert', 'investisseurs'],
  },
  // ── BKAM Notes & Guides ────────────────────────────────────────────────────
  {
    id: 'bkam-methodo-fixing',
    title: 'BKAM — Methodology of the MAD Reference Exchange Rate',
    titleFr: 'BKAM — Méthodologie du Cours de Référence du Dirham',
    titleAr: 'بنك المغرب — منهجية سعر صرف الدرهم المرجعي',
    date: '2018-07-02',
    category: 'BKAM_NOTE',
    url: BKAM_LINKS.methodologyTCRE,
    summary: "Official methodology for computing the MAD fixing rate from the EUR/USD basket (60/40 weighting) and BKAM's 14-currency panel.",
    summaryFr: 'Méthodologie officielle du calcul du cours de référence MAD à partir du panier EUR/USD (pondération 60/40) et panel 14 devises BKAM.',
    summaryAr: 'المنهجية الرسمية لحساب سعر صرف الدرهم المرجعي Ù…Ù† سلة اليورو/الدولار (ترجيح 60/40) ولجنة 14 عملة لبنك المغرب.',
    tags: ['fixing', 'méthodologie', 'panier', 'EUR/USD', 'MAD'],
  },
  {
    id: 'bkam-flexibilite-2018',
    title: 'BKAM — Foreign Exchange Regime Flexibility (January 2018)',
    titleFr: 'BKAM — Élargissement des Marges de Fluctuation du Dirham (Janvier 2018)',
    titleAr: 'بنك المغرب — توسيع هامش تذبذب الدرهم (يناير 2018)',
    date: '2018-01-15',
    category: 'BKAM_NOTE',
    url: BKAM_LINKS.regimeDeChange,
    summary: 'BKAM widens MAD fluctuation band from ±0.3% to ±2.5% against the EUR/USD basket, marking Morocco\'s move toward greater FX flexibility.',
    summaryFr: 'Élargissement du taux de fluctuation du dirham de ±0,3% à ±2,5% par rapport au panier EUR/USD — passage vers plus de flexibilité.',
    summaryAr: 'توسيع هامش تذبذب الدرهم Ù…Ù† ±0.3% إلى ±2.5% مقابل سلة اليورو/الدولار — التحول نحو مرونة أكبر.',
    tags: ['flexibilité', 'bande', 'fluctuation', 'regime change', '2018'],
  },
  {
    id: 'bkam-guide-entreprises',
    title: 'BKAM — Practical Guide for FX Operations by Moroccan Companies',
    titleFr: 'BKAM — Guide Pratique des Opérations de Change pour les Entreprises',
    titleAr: 'بنك المغرب — الدليل العملي لعمليات الصرف للشركات',
    date: '2020-03-01',
    category: 'BKAM_GUIDE',
    url: BKAM_LINKS.guideEntreprises,
    summary: 'Practical guide covering FX operations available to Moroccan companies: spot, forward, options, and documentary requirements.',
    summaryFr: 'Guide pratique des opérations de change disponibles aux entreprises marocaines : spot, forward, options et exigences documentaires.',
    summaryAr: 'دليل عملي لعمليات الصرف المتاحة للشركات المغربية: الفوري والآجل والخيارات والمتطلبات الوثائقية.',
    tags: ['guide', 'entreprises', 'spot', 'forward', 'options'],
  },
];

const CATEGORY_META = {
  OC_CIRC:    { label: 'OC Circulaires',  labelEn: 'OC Circulars',   labelAr: 'منشورات Ù….ص',  icon: Scale,    color: 'text-gold-400',    bg: 'bg-gold-500/10 border-gold-700' },
  OC_INSTR:   { label: 'OC Instructions', labelEn: 'OC Instructions', labelAr: 'تعليمات Ù….ص',  icon: FileText, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-700' },
  BKAM_NOTE:  { label: 'Notes BKAM',      labelEn: 'BKAM Notes',      labelAr: 'ملاحظات ب.Ù…',  icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-700' },
  BKAM_GUIDE: { label: 'Guides BKAM',     labelEn: 'BKAM Guides',     labelAr: 'أدلة ب.Ù…',     icon: Shield,   color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-700' },
};

type Category = keyof typeof CATEGORY_META;

function getCatLabel(cat: Category, locale: string): string {
  const m = CATEGORY_META[cat];
  return locale === 'ar' ? m.labelAr : locale === 'en' ? m.labelEn : m.label;
}

function getDocText(doc: RegDoc, locale: string): { title: string; summary: string } {
  if (locale === 'ar') return { title: doc.titleAr, summary: doc.summaryAr };
  if (locale === 'en') return { title: doc.title,   summary: doc.summary };
  return { title: doc.titleFr, summary: doc.summaryFr };
}

export default function RegulationsPage() {
  const { locale, isRTL } = useI18n();
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const heading = locale === 'ar' ? 'المرجعية التنظيمية' : locale === 'en' ? 'Regulatory Reference' : 'Référentiel Réglementaire';
  const sub     = locale === 'ar'
    ? 'النصوص الرسمية لمكتب الصرف وبنك المغرب المتعلقة بسوق الصرف'
    : locale === 'en'
    ? 'Official Office des Changes & BKAM texts governing the FX market'
    : 'Textes officiels de l\'Office des Changes & BKAM régissant le marché des changes';
  const searchPlaceholder = locale === 'ar' ? 'ابحث في الأنظمة…' : locale === 'en' ? 'Search regulations…' : 'Rechercher…';
  const openLabel = locale === 'ar' ? 'فتح الوثيقة الرسمية' : locale === 'en' ? 'Open Official Document' : 'Ouvrir le Document Officiel';
  const updatedLabel = locale === 'ar' ? 'تاريخ النشر:' : locale === 'en' ? 'Date:' : 'Date:';
  const allLabel = locale === 'ar' ? 'الكل' : locale === 'en' ? 'All' : 'Tout';
  const disclaimerText = locale === 'ar'
    ? 'هذه القائمة للأغراض التعليمية فقط. تحقق دائمًا Ù…Ù† الإصدارات الرسمية الأحدث على مواقع مكتب الصرف وبنك المغرب.'
    : locale === 'en'
    ? 'This list is for educational purposes only. Always verify against the latest official versions on oc.gov.ma and bkam.ma.'
    : 'Cette liste est fournie à titre informatif. Vérifiez toujours les versions officielles les plus récentes sur oc.gov.ma et bkam.ma.';

  const categories = Object.keys(CATEGORY_META) as Category[];

  const filtered = REGULATIONS.filter(doc => {
    const { title, summary } = getDocText(doc, locale);
    const matchesCat = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesSearch = !search || [title, summary, ...doc.tags].some(s =>
      s.toLowerCase().includes(search.toLowerCase())
    );
    return matchesCat && matchesSearch;
  });

  const grouped = categories.reduce<Record<Category, RegDoc[]>>((acc, cat) => {
    acc[cat] = filtered.filter(d => d.category === cat);
    return acc;
  }, {} as Record<Category, RegDoc[]>);

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gold-500/10 border border-gold-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale size={18} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white tracking-wide">{heading}</h2>
            <p className="text-slate-400 text-sm mt-1">{sub}</p>
          </div>
          <div className="flex gap-3 text-[10px] font-mono text-slate-500">
            <a href="https://www.oc.gov.ma" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-gold-400 transition">
              <Globe size={10} /> oc.gov.ma
            </a>
            <a href={BKAM_LINKS.mainSite} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-gold-400 transition">
              <Globe size={10} /> bkam.ma
            </a>
          </div>
        </div>

        {/* Search + category filter */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-gold-500 placeholder-slate-600"
          />
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                activeCategory === 'ALL'
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-800 text-slate-400 border border-navy-700 hover:border-gold-600'
              }`}
            >
              {allLabel}
            </button>
            {categories.map(cat => {
              const m = CATEGORY_META[cat];
              const Icon = m.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition ${
                    activeCategory === cat ? m.bg + ' ' + m.color : 'bg-navy-800 text-slate-400 border-navy-700 hover:border-navy-500'
                  }`}
                >
                  <Icon size={10} />
                  {getCatLabel(cat, locale)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {locale === 'ar' ? 'لا توجد نتائج' : locale === 'en' ? 'No results found' : 'Aucun résultat'}
        </div>
      ) : (
        categories.map(cat => {
          const docs = grouped[cat];
          if (!docs.length) return null;
          const m = CATEGORY_META[cat];
          const Icon = m.icon;
          return (
            <div key={cat}>
              {/* Category heading */}
              <div className={`flex items-center gap-2 mb-3 px-1`}>
                <Icon size={13} className={m.color} />
                <h3 className={`text-xs font-bold uppercase tracking-widest ${m.color}`}>
                  {getCatLabel(cat, locale)}
                </h3>
                <span className="text-[10px] text-slate-600 font-mono">({docs.length})</span>
              </div>

              <div className="space-y-2">
                {docs.map(doc => {
                  const { title, summary } = getDocText(doc, locale);
                  const isOpen = expanded === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`bg-navy-900 border rounded-lg overflow-hidden transition-all ${
                        isOpen ? 'border-gold-700/60' : 'border-navy-700 hover:border-navy-600'
                      }`}
                    >
                      {/* Row header */}
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        onClick={() => setExpanded(isOpen ? null : doc.id)}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${m.bg.includes('gold') ? 'bg-gold-600' : m.bg.includes('blue') ? 'bg-blue-600' : m.bg.includes('emerald') ? 'bg-emerald-600' : 'bg-purple-600'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white leading-snug">{title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {updatedLabel} {doc.date}
                            </p>
                          </div>
                        </div>
                        {isOpen ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0 ml-3" /> : <ChevronRight size={14} className="text-slate-500 flex-shrink-0 ml-3" />}
                      </button>

                      {/* Expanded body */}
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-navy-800">
                          <p className="text-sm text-slate-300 mt-3 leading-relaxed">{summary}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {doc.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-navy-800 text-slate-500 border border-navy-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded transition"
                            >
                              <ExternalLink size={12} />
                              {openLabel}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg px-4 py-3">
        <p className="text-[11px] text-amber-400/80 leading-relaxed">{disclaimerText}</p>
      </div>
    </div>
  );
}
