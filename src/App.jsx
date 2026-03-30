import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Printer, Trash2, AlertTriangle, 
  CheckCircle2, RefreshCw, Database, Settings2, 
  AlertOctagon, CalendarDays, Menu, 
  ChevronLeft, Check, Network, Search, Target, LayoutTemplate, Download, HardDrive, Upload, Save
} from 'lucide-react';

const initialCard = {
  id: "VT-02",
  procesblok: "Verwijzing t/m triage",
  knelpunten: "Verwijzing is niet altijd volledig\nOnduidelijk wie ontbrekende informatie opvraagt\nVervolgroute bij incomplete informatie is niet expliciet",
  vermoedeOorzaak: "Ontbrekende verplichte velden in ZorgDomein\nGeen harde afspraken met verwijzers",
  bron: "Verwijzer (Huisarts/Specialist)",
  systeem: "ZorgDomein / XDS",
  input: "Verwijsbrief, medische voorgeschiedenis, beelden",
  klant: "Triage verpleegkundige / Radiotherapeut",
  ontwerpprincipe: "GEGEVEN een incomplete verwijzing\nWANNEER deze in ZorgDomein wordt ontvangen\nDAN krijgt deze de status 'aanvulling nodig'",
  minimalViableDataset: "Status: 'aanvulling nodig'\nTaak aanmaken voor de poli\nWorklist / zichtbaarheid dossierstatus\nReminder op openstaande taak",
  uitzonderingen: "Spoed\nMDO-instroom\nInformatie deels beschikbaar",
  arisePrecisie: "Minimale dataset verplicht vóór start triage\nOntbrekende informatie → status: 'aanvulling nodig'\nTaak wordt aangemaakt voor de poli",
  ariseHarmony: "Triage mag starten met beperkte informatie\nOntbrekende informatie parallel aanvullen\nSignaal zichtbaar, maar geen blokkade",
  verdict: "",
  eigenaar: "",
  vervolgactie: "",
  deadline: ""
};

export default function App() {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('ddc_cards');
    return saved ? JSON.parse(saved) : [initialCard];
  });
  const [activeCardId, setActiveCardId] = useState(cards[0]?.id || initialCard.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSaveStatus("saving");
    localStorage.setItem('ddc_cards', JSON.stringify(cards));
    const timer = setTimeout(() => setSaveStatus("saved"), 500);
    return () => clearTimeout(timer);
  }, [cards]);

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handleAddCard = () => {
    const newId = `VT-${String(cards.length + 1).padStart(2, '0')}`;
    const newCard = { ...initialCard, id: newId, procesblok: "Nieuw Procesblok..." };
    const newCards = [...cards, newCard];
    setCards(newCards);
    setActiveCardId(newId);
  };

  const handleDeleteCard = (id) => {
    if (cards.length === 1) return alert("Je kunt de laatste kaart niet verwijderen.");
    const newCards = cards.filter(c => c.id !== id);
    setCards(newCards);
    if (activeCardId === id) setActiveCardId(newCards[0].id);
  };

  const handleChange = (id, field, value) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(cards); 
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ddc-cards-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedCards = JSON.parse(event.target.result);
        if (Array.isArray(importedCards) && importedCards.length > 0) {
          setCards(importedCards);
          setActiveCardId(importedCards[0].id);
        }
      } catch (error) {
        alert("Fout bij het importeren. Zorg dat het een geldig JSON-bestand is.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const renderList = (text) => {
    if (!text) return null;
    return text.split('\n').filter(line => line.trim() !== '').map((item, i) => (
      <li key={i} className="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-1.5 before:h-1.5 before:bg-slate-400 before:rounded-full">
        {item}
      </li>
    ));
  };

  const renderGherkin = (text) => {
    if (!text) return null;
    return text.split('\n').filter(line => line.trim() !== '').map((item, i) => {
      const parts = item.trim().split(' ');
      const keyword = parts[0];
      const rest = parts.slice(1).join(' ');
      if (['GEGEVEN', 'WANNEER', 'DAN', 'EN', 'GIVEN', 'WHEN', 'THEN', 'AND'].includes(keyword.toUpperCase())) {
        return (
          <div key={i} className="mb-1.5">
            <span className="font-extrabold uppercase text-slate-800 text-[11px] tracking-wider mr-2">{keyword}</span> 
            <span className="text-slate-700">{rest}</span>
          </div>
        );
      }
      return <div key={i} className="mb-1.5">{item}</div>;
    });
  };

  const handlePrintSingle = () => {
    setIsPrintingAll(false);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    setTimeout(() => window.print(), 100);
  };

  const Section = ({ icon: Icon, title, children, accentClass = "text-slate-600", iconBg = "bg-white border-slate-200" }) => (
    <div className="flex flex-col bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-1.5 rounded-lg border ${iconBg} ${accentClass} bg-white shadow-sm`}>
          <Icon className="w-4 h-4 stroke-[2.5px]" />
        </div>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</h2>
      </div>
      <div className="text-[13px] font-semibold text-slate-700 leading-relaxed space-y-1.5 mt-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans overflow-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .minimal-input {
            width: 100%; background: transparent; border: none;
            border-bottom: 2px dotted #cbd5e1; padding: 4px 0;
            font-size: inherit; font-weight: 800; color: #0f172a;
            outline: none; transition: border-color 0.2s;
        }
        .minimal-input:focus { border-bottom-style: solid; border-bottom-color: #0ea5e9; }
        @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * {
                visibility: visible;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .print-area {
                position: absolute; left: 0; top: 0;
                width: 100%; margin: 0; padding: 0; background: white !important;
            }
            .print-page { page-break-after: always; break-after: page; }
            .print-page:last-child { page-break-after: auto; break-after: auto; }
            @page { size: landscape; margin: 10mm; }
            .no-print { display: none !important; }
        }
      `}} />

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-6 left-6 z-30 p-3 bg-slate-800 text-white hover:bg-slate-700 rounded-full shadow-lg no-print transition-all hover:scale-105" title="Open Menu">
          <Menu className="w-5 h-5" />
        </button>
      )}

      {isSidebarOpen && (
        <div className="w-[420px] shrink-0 bg-white border-r border-slate-200 shadow-2xl flex flex-col z-20 no-print h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <div>
                  <h1 className="font-bold text-lg flex items-center gap-2">
                      <LayoutTemplate className="w-5 h-5 text-sky-400" />
                      DDC Builder
                  </h1>
                  <div className="flex items-center gap-1 mt-1 text-slate-400">
                      {saveStatus === "saving" ? (
                        <><span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" /><span className="text-[10px] uppercase tracking-widest">Opslaan...</span></>
                      ) : (
                        <><HardDrive className="w-3 h-3 text-emerald-400" /><span className="text-[10px] uppercase tracking-widest text-emerald-400">Lokaal opgeslagen</span></>
                      )}
                  </div>
              </div>
              <div className="flex gap-2">
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white" title="Importeer Data (JSON)">
                    <Upload className="w-4 h-4" />
                </button>
                <button onClick={handleExportData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white" title="Exporteer Data (JSON)">
                    <Save className="w-4 h-4" />
                </button>
                <button onClick={handlePrintAll} className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors text-white text-[10px] font-extrabold uppercase tracking-widest" title="Exporteer PDF">
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white" title="Verberg Menu">
                    <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <select className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900" value={activeCardId} onChange={(e) => setActiveCardId(e.target.value)}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.id} - {c.procesblok}</option>)}
              </select>
              <button onClick={handleAddCard} className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors" title="Nieuwe kaart"><Plus className="w-4 h-4" /></button>
              <button onClick={() => handleDeleteCard(activeCardId)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors" title="Verwijderen"><Trash2 className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
              <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] mb-4">Header</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">DDC-ID</label>
                          <input type="text" value={activeCard?.id || ""} onChange={(e) => handleChange(activeCardId, 'id', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm font-semibold" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Procesblok</label>
                          <input type="text" value={activeCard?.procesblok || ""} onChange={(e) => handleChange(activeCardId, 'procesblok', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm font-semibold" />
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-orange-400 uppercase tracking-widest text-[10px] mb-4">1. Probleemanalyse</h3>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Knelpunten</label>
                      <textarea rows="3" value={activeCard?.knelpunten || ""} onChange={(e) => handleChange(activeCardId, 'knelpunten', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vermoede oorzaak</label>
                      <textarea rows="3" value={activeCard?.vermoedeOorzaak || ""} onChange={(e) => handleChange(activeCardId, 'vermoedeOorzaak', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-blue-400 uppercase tracking-widest text-[10px] mb-4">2. Informatie & Data</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bron</label>
                        <input type="text" value={activeCard?.bron || ""} onChange={(e) => handleChange(activeCardId, 'bron', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Systeem</label>
                        <input type="text" value={activeCard?.systeem || ""} onChange={(e) => handleChange(activeCardId, 'systeem', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Input</label>
                        <input type="text" value={activeCard?.input || ""} onChange={(e) => handleChange(activeCardId, 'input', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Klant</label>
                        <input type="text" value={activeCard?.klant || ""} onChange={(e) => handleChange(activeCardId, 'klant', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm" />
                    </div>
                  </div>
                  <div className="pt-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Minimal Viable Dataset</label>
                      <textarea rows="3" value={activeCard?.minimalViableDataset || ""} onChange={(e) => handleChange(activeCardId, 'minimalViableDataset', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] mb-4">3. Randvoorwaarden</h3>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ontwerpprincipe (Gherkin)</label>
                      <textarea rows="3" value={activeCard?.ontwerpprincipe || ""} onChange={(e) => handleChange(activeCardId, 'ontwerpprincipe', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none font-mono text-xs"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Uitzonderingen</label>
                      <textarea rows="2" value={activeCard?.uitzonderingen || ""} onChange={(e) => handleChange(activeCardId, 'uitzonderingen', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px] mb-4">4. Ontwerprichtingen</h3>
                  <div>
                      <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">ARISE Precisie</label>
                      <textarea rows="3" value={activeCard?.arisePrecisie || ""} onChange={(e) => handleChange(activeCardId, 'arisePrecisie', e.target.value)} className="w-full border border-emerald-200 bg-emerald-50/30 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">ARISE Harmony</label>
                      <textarea rows="3" value={activeCard?.ariseHarmony || ""} onChange={(e) => handleChange(activeCardId, 'ariseHarmony', e.target.value)} className="w-full border border-purple-200 bg-purple-50/30 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start print:p-0 print:bg-white">
        <div className="print-area w-full max-w-[1100px] font-jakarta flex flex-col items-center">
            {cards.map((card) => {
                const isActive = card.id === activeCardId;
                const visibilityClass = isActive ? "block print:block" : (isPrintingAll ? "hidden print:block" : "hidden print:hidden");

                return (
                <div key={card.id} className={`print-page w-full ${visibilityClass} mb-8 print:mb-0`}>
                    <div className="bg-white rounded-2xl flex flex-col relative shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200 print:border-2 print:border-slate-800 print:shadow-none print:h-[96vh] print:rounded-2xl print:overflow-hidden">
                        
                        <div className="flex justify-between items-center p-6 lg:px-10 bg-slate-900 text-white rounded-t-2xl print:rounded-t-[14px]">
                            <div className="flex items-center gap-6">
                                <div className="bg-sky-500/20 text-sky-300 border border-sky-400/30 px-4 py-1.5 rounded-md flex flex-col items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">DDC-ID</span>
                                    <span className="text-xl font-bold leading-none">{card.id}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1">Procesblok</p>
                                    <h1 className="text-2xl font-black tracking-tight">{card.procesblok}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 lg:p-8 flex flex-col gap-5 bg-white flex-1">
                            <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 mb-4 ml-1">1. Probleem & Oorzaak</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Section icon={AlertTriangle} title="Knelpunten" accentClass="text-orange-600" iconBg="border-orange-200">
                                        <ul className="space-y-1.5">{renderList(card.knelpunten)}</ul>
                                    </Section>
                                    <Section icon={Search} title="Vermoede oorzaak" accentClass="text-amber-600" iconBg="border-amber-200">
                                        <ul className="space-y-1.5">{renderList(card.vermoedeOorzaak)}</ul>
                                    </Section>
                                </div>
                            </div>

                            <div className="bg-blue-50/40 rounded-xl border border-blue-100 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-4 ml-1">2. Data & Informatiestroom</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col bg-white/70 p-5 rounded-xl border border-white/50 shadow-sm h-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-1.5 rounded-lg border border-indigo-200 bg-white shadow-sm">
                                                <Network className="w-4 h-4 stroke-[2.5px] text-indigo-600" />
                                            </div>
                                            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">Informatieketen</h2>
                                        </div>
                                        <div className="grid grid-cols-1 gap-y-2 text-[13px]">
                                            <div className="flex items-center border-b border-slate-100/80 pb-1.5">
                                                <span className="font-extrabold text-slate-400 uppercase tracking-widest w-20 text-[10px]">Bron</span>
                                                <span className="font-bold text-slate-700 flex-1">{card.bron}</span>
                                            </div>
                                            <div className="flex items-center border-b border-slate-100/80 pb-1.5">
                                                <span className="font-extrabold text-slate-400 uppercase tracking-widest w-20 text-[10px]">Systeem</span>
                                                <span className="font-bold text-slate-700 flex-1">{card.systeem}</span>
                                            </div>
                                            <div className="flex items-center border-b border-slate-100/80 pb-1.5">
                                                <span className="font-extrabold text-slate-400 uppercase tracking-widest w-20 text-[10px]">Input</span>
                                                <span className="font-bold text-slate-700 flex-1">{card.input}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="font-extrabold text-slate-400 uppercase tracking-widest w-20 text-[10px]">Klant</span>
                                                <span className="font-bold text-slate-700 flex-1">{card.klant}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Section icon={Database} title="Minimal Viable Dataset" accentClass="text-blue-600" iconBg="border-blue-200">
                                        <ul className="space-y-1.5">{renderList(card.minimalViableDataset)}</ul>
                                    </Section>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4 ml-1">3. Randvoorwaarden</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Section icon={Target} title="Ontwerpprincipe" accentClass="text-slate-600" iconBg="border-slate-300">
                                        <div className="space-y-1.5 bg-slate-100/50 p-3 rounded-lg border border-slate-100/80 text-[12px]">
                                            {renderGherkin(card.ontwerpprincipe)}
                                        </div>
                                    </Section>
                                    <Section icon={AlertOctagon} title="Uitzonderingen" accentClass="text-rose-500" iconBg="border-rose-200">
                                        <ul className="space-y-1.5 text-slate-700">{renderList(card.uitzonderingen)}</ul>
                                    </Section>
                                </div>
                            </div>

                            <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-4 ml-1">4. Ontwerprichtingen</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Section icon={CheckCircle2} title="ARISE Precisie" accentClass="text-emerald-600" iconBg="border-emerald-300 bg-emerald-50">
                                        <ul className="space-y-1.5 text-slate-800">{renderList(card.arisePrecisie)}</ul>
                                    </Section>
                                    <Section icon={RefreshCw} title="ARISE Harmony" accentClass="text-violet-600" iconBg="border-violet-300 bg-violet-50">
                                        <ul className="space-y-1.5 text-slate-800">{renderList(card.ariseHarmony)}</ul>
                                    </Section>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 lg:px-10 py-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl print:rounded-b-[14px] flex flex-col lg:flex-row gap-6 justify-between items-center mt-auto">
                            <div className="flex gap-2.5 flex-wrap">
                                <button onClick={() => handleChange(card.id, 'verdict', 'akkoord')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-widest transition-all ${card.verdict === 'akkoord' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                                    {card.verdict === 'akkoord' && <Check className="w-3.5 h-3.5" strokeWidth={4} />} Akkoord
                                </button>
                                <button onClick={() => handleChange(card.id, 'verdict', 'aanpassen')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-widest transition-all ${card.verdict === 'aanpassen' ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'}`}>
                                    {card.verdict === 'aanpassen' && <Check className="w-3.5 h-3.5" strokeWidth={4} />} Aanpassen
                                </button>
                                <button onClick={() => handleChange(card.id, 'verdict', 'uitzoeken')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-widest transition-all ${card.verdict === 'uitzoeken' ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-200' : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600'}`}>
                                    {card.verdict === 'uitzoeken' && <Check className="w-3.5 h-3.5" strokeWidth={4} />} Uitzoeken
                                </button>
                            </div>

                            <div className="flex gap-6 w-full lg:w-auto">
                                <div className="flex flex-col flex-1 lg:w-44">
                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">Eigenaar</label>
                                    <input type="text" value={card.eigenaar || ""} onChange={(e) => handleChange(card.id, 'eigenaar', e.target.value)} className="minimal-input" />
                                </div>
                                <div className="flex flex-col flex-1 lg:w-44">
                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">Vervolgactie</label>
                                    <input type="text" value={card.vervolgactie || ""} onChange={(e) => handleChange(card.id, 'vervolgactie', e.target.value)} className="minimal-input" />
                                </div>
                                <div className="flex flex-col flex-1 lg:w-36 relative">
                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">Deadline</label>
                                    <input type="text" value={card.deadline || ""} onChange={(e) => handleChange(card.id, 'deadline', e.target.value)} className="minimal-input pr-6" />
                                    <CalendarDays className="w-4 h-4 text-slate-300 absolute right-0 bottom-1.5 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}