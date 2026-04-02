import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Printer, Trash2, AlertTriangle, 
  CheckCircle2, RefreshCw, Database, Settings2, 
  CalendarDays, Menu, ChevronLeft, Check, Search, 
  LayoutTemplate, Download, Upload, Save,
  ZoomIn, ZoomOut, Type, Wrench, Waypoints, MonitorSmartphone, Binary,
  FileText, Loader2
} from 'lucide-react';

const initialCard = {
  id: "VT-01",
  procesblok: "",
  knelpunten: "",
  vermoedeOorzaak: "",
  workarounds: "",
  minimalViableDataset: "",
  ontwerpProces: "",
  ontwerpSysteem: "",
  ontwerpData: "",
  arisePrecisie: "",
  ariseHarmony: "",
  gekozenRichting: "", // 'precisie' of 'harmony'
  opmerkingen: ""
};

const Section = ({ icon: Icon, title, children, accentClass = "text-slate-600", iconBg = "bg-white border-slate-200" }) => (
  <div className="flex flex-col bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm h-full">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-1.5 rounded-lg border ${iconBg} ${accentClass} bg-white shadow-sm`}>
        <Icon className="w-4 h-4 stroke-[2.5px]" />
      </div>
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</h2>
    </div>
    <div className="text-[13px] font-semibold text-slate-700 leading-relaxed space-y-1.5 mt-1 text-left">
      {children}
    </div>
  </div>
);

export default function App() {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('ddc_cards');
    return saved ? JSON.parse(saved) : [initialCard];
  });
  const [activeCardId, setActiveCardId] = useState(cards[0]?.id || initialCard.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // States voor zoom, lettergrootte en slimme PDF generator
  const [zoomLevel, setZoomLevel] = useState(1); 
  const [fontScale, setFontScale] = useState(1); 
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfMode, setPdfMode] = useState(null); // 'single' of 'all'
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ddc_cards', JSON.stringify(cards));
  }, [cards]);

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handleAddCard = () => {
    const nextNum = cards.length + 1;
    const newId = `VT-${String(nextNum).padStart(2, '0')}`;
    const newCard = { ...initialCard, id: newId };
    const newCards = [...cards, newCard];
    setCards(newCards);
    setActiveCardId(newId);
  };

  const handleDeleteCard = (id) => {
    if (cards.length === 1) {
      setCards([initialCard]);
      setActiveCardId(initialCard.id);
      return;
    }
    const newCards = cards.filter(c => c.id !== id);
    setCards(newCards);
    if (activeCardId === id) setActiveCardId(newCards[0].id);
  };

  const handleChange = (id, field, value) => {
    setCards(prevCards => prevCards.map(c => c.id === id ? { ...c, [field]: value } : c));
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
        console.error("Import error");
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  // Zoom handlers 
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  // Font handlers 
  const handleFontIncrease = () => setFontScale(prev => Math.min(prev + 0.05, 1.4));
  const handleFontDecrease = () => setFontScale(prev => Math.max(prev - 0.05, 0.7));
  const handleFontReset = () => setFontScale(1);

  // --- NIEUWE SLIMME PDF GENERATOR ---
  const generateSmartPDF = async (mode) => {
    setPdfMode(mode);
    setIsGeneratingPDF(true);

    try {
      // Dynamisch inladen van de libraries zodat je geen build/import errors krijgt
      if (!window.html2canvas) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.jspdf) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Korte pauze zodat React de DOM onzichtbaar kan renderen
      await new Promise(resolve => setTimeout(resolve, 300));

      const jsPDF = window.jspdf.jsPDF;
      const html2canvas = window.html2canvas;

      // A4 Liggend
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const cardsToExport = mode === 'all' ? cards : [activeCard];
      
      for (let i = 0; i < cardsToExport.length; i++) {
        const card = cardsToExport[i];
        const element = document.getElementById(`pdf-card-${card.id}`);
        
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdfWidth = 297;
        const pdfHeight = 210;
        
        const canvasRatio = canvas.width / canvas.height;
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth / canvasRatio;
        
        if (imgHeight > pdfHeight) {
          imgHeight = pdfHeight;
          imgWidth = pdfHeight * canvasRatio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
      }
      
      const filename = mode === 'all' ? 'ddc-alle-besluiten.pdf' : `ddc-${activeCard.id}.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error("Fout bij PDF generatie: ", error);
      alert("Er ging iets mis bij het genereren van de PDF.");
    } finally {
      setIsGeneratingPDF(false);
      setPdfMode(null);
    }
  };

  const renderList = (text) => {
    if (!text) return <span className="text-slate-300 italic font-normal text-xs uppercase tracking-tight">Geen invoer...</span>;
    return text.split('\n').filter(line => line.trim() !== '').map((item, i) => (
      <li key={i} className="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-1.5 before:h-1.5 before:bg-slate-400 before:rounded-full text-left">
        {item}
      </li>
    ));
  };

  // Zorg dat de schaal op 100% (1) staat tijdens het printen, zodat de screenshot klopt
  const activeZoom = isGeneratingPDF ? 1 : zoomLevel;

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans overflow-hidden relative">
      
      {/* LAAD OVERLAY VOOR PDF EXPORT */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Loader2 className="w-16 h-16 animate-spin text-sky-400 mb-6" />
            <h2 className="text-2xl font-bold mb-2">PDF Genereren...</h2>
            <p className="text-slate-300">De bestanden worden klaargemaakt. Dit kan enkele seconden duren.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        /* Dynamische Lettergrootte overrides */
        .print-area .text-sm { font-size: calc(0.875rem * var(--font-scale)) !important; line-height: calc(1.25rem * var(--font-scale)) !important; }
        .print-area .text-xs { font-size: calc(0.75rem * var(--font-scale)) !important; line-height: calc(1rem * var(--font-scale)) !important; }
        .print-area .text-\\[13px\\] { font-size: calc(13px * var(--font-scale)) !important; line-height: calc(18px * var(--font-scale)) !important; }
        .print-area .text-\\[11px\\] { font-size: calc(11px * var(--font-scale)) !important; line-height: calc(16px * var(--font-scale)) !important; }
        .print-area .text-\\[10px\\] { font-size: calc(10px * var(--font-scale)) !important; line-height: calc(14px * var(--font-scale)) !important; }
        .print-area .text-\\[9px\\] { font-size: calc(9px * var(--font-scale)) !important; line-height: calc(12px * var(--font-scale)) !important; }
        .print-area .text-lg { font-size: calc(1.125rem * var(--font-scale)) !important; line-height: calc(1.75rem * var(--font-scale)) !important; }
        .print-area .text-xl { font-size: calc(1.25rem * var(--font-scale)) !important; line-height: calc(1.75rem * var(--font-scale)) !important; }
        .print-area .text-2xl { font-size: calc(1.5rem * var(--font-scale)) !important; line-height: calc(2rem * var(--font-scale)) !important; }
        .print-area textarea, .print-area input { font-size: calc(0.875rem * var(--font-scale)) !important; }
        
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
                transform: none !important;
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

      {/* ZWEVEND CONTROLE PANEEL */}
      <div className="fixed bottom-6 right-8 z-30 flex items-center bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1.5 no-print divide-x divide-slate-100">
        <div className="flex items-center gap-1 pr-2">
            <div className="pl-2 pr-1 text-slate-400"><Type className="w-4 h-4" /></div>
            <button onClick={handleFontDecrease} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors font-bold" title="Lettertype verkleinen">
              <span className="text-[10px] leading-none">A-</span>
            </button>
            <button onClick={handleFontReset} className="px-1 py-1 text-[11px] font-black tracking-widest text-slate-700 hover:text-sky-600 transition-colors text-center min-w-[3rem]" title="Reset Lettertype">
              {Math.round(fontScale * 100)}%
            </button>
            <button onClick={handleFontIncrease} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors font-bold" title="Lettertype vergroten">
              <span className="text-sm leading-none">A+</span>
            </button>
        </div>
        <div className="flex items-center gap-1 pl-2">
            <button onClick={handleZoomOut} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" title="Uitzoomen (Scherm)">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleZoomReset} className="px-1 py-1 text-[11px] font-black tracking-widest text-slate-700 hover:text-sky-600 transition-colors text-center min-w-[3rem]" title="Reset Zoom">
              {Math.round(zoomLevel * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" title="Inzoomen (Scherm)">
              <ZoomIn className="w-4 h-4" />
            </button>
        </div>
      </div>

      {isSidebarOpen && (
        <div className="w-[420px] shrink-0 bg-white border-r border-slate-200 shadow-2xl flex flex-col z-20 no-print h-full font-jakarta">
          <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <div>
                  <h1 className="font-bold text-lg flex items-center gap-2">
                      <LayoutTemplate className="w-5 h-5 text-sky-400" />
                      DDC Builder
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Nieuw Project</p>
              </div>
              <div className="flex gap-2">
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white" title="Importeer Data (JSON)">
                    <Upload className="w-4 h-4" />
                </button>
                <button onClick={handleExportData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white" title="Exporteer Data (JSON)">
                    <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white" title="Verberg Menu">
                    <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
          </div>

          {/* NIEUWE PDF KNOPPEN */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-800 flex gap-2 justify-between">
             <button onClick={() => generateSmartPDF('single')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors text-white text-[11px] font-extrabold uppercase tracking-widest" title="Exporteer actieve kaart">
                  <FileText className="w-4 h-4" />
                  <span>Deze (PDF)</span>
              </button>
              <button onClick={() => generateSmartPDF('all')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-white text-[11px] font-extrabold uppercase tracking-widest" title="Exporteer alle kaarten">
                  <Download className="w-4 h-4" />
                  <span>Alles (PDF)</span>
              </button>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <select className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900" value={activeCardId} onChange={(e) => setActiveCardId(e.target.value)}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.id} - {c.procesblok || "Naamloos"}</option>)}
              </select>
              <button onClick={handleAddCard} className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors" title="Nieuwe kaart"><Plus className="w-4 h-4" /></button>
              <button onClick={() => handleDeleteCard(activeCardId)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors" title="Verwijderen"><Trash2 className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
              <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] mb-4">Header</h3>
                  <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Procesblok</label>
                          <input type="text" value={activeCard?.procesblok || ""} onChange={(e) => handleChange(activeCardId, 'procesblok', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm font-semibold" placeholder="Bijv. Aanmelding..." />
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
                  <h3 className="font-extrabold text-blue-400 uppercase tracking-widest text-[10px] mb-4">2. Huidige Situatie & Data</h3>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Workarounds (As-Is)</label>
                      <textarea rows="3" value={activeCard?.workarounds || ""} onChange={(e) => handleChange(activeCardId, 'workarounds', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Minimal Viable Dataset</label>
                      <textarea rows="3" value={activeCard?.minimalViableDataset || ""} onChange={(e) => handleChange(activeCardId, 'minimalViableDataset', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] mb-4">3. Ontwerpprincipes (To-Be)</h3>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Procesniveau</label>
                      <textarea rows="2" value={activeCard?.ontwerpProces || ""} onChange={(e) => handleChange(activeCardId, 'ontwerpProces', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Systeemniveau</label>
                      <textarea rows="2" value={activeCard?.ontwerpSysteem || ""} onChange={(e) => handleChange(activeCardId, 'ontwerpSysteem', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Dataniveau</label>
                      <textarea rows="2" value={activeCard?.ontwerpData || ""} onChange={(e) => handleChange(activeCardId, 'ontwerpData', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px] mb-4">4. Opties & Richtingen</h3>
                  <div>
                      <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">ARISE Precisie</label>
                      <textarea rows="3" value={activeCard?.arisePrecisie || ""} onChange={(e) => handleChange(activeCardId, 'arisePrecisie', e.target.value)} className="w-full border border-emerald-200 bg-emerald-50/30 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">ARISE Harmony</label>
                      <textarea rows="3" value={activeCard?.ariseHarmony || ""} onChange={(e) => handleChange(activeCardId, 'ariseHarmony', e.target.value)} className="w-full border border-purple-200 bg-purple-50/30 rounded-md p-2 text-sm resize-none"></textarea>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] mb-4">5. Besluit & Opmerkingen</h3>
                  <div className="grid grid-cols-1 gap-4 pb-10">
                      <div className="flex gap-2">
                          <button 
                              onClick={() => handleChange(activeCardId, 'gekozenRichting', 'precisie')} 
                              className={`flex-1 py-2 rounded-md border text-xs font-bold transition-colors ${activeCard?.gekozenRichting === 'precisie' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                              Precisie
                          </button>
                          <button 
                              onClick={() => handleChange(activeCardId, 'gekozenRichting', 'harmony')} 
                              className={`flex-1 py-2 rounded-md border text-xs font-bold transition-colors ${activeCard?.gekozenRichting === 'harmony' ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                              Harmony
                          </button>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Opmerkingen / Toelichting</label>
                          <textarea rows="3" value={activeCard?.opmerkingen || ""} onChange={(e) => handleChange(activeCardId, 'opmerkingen', e.target.value)} className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none"></textarea>
                      </div>
                  </div>
              </div>

          </div>
        </div>
      )}

      {/* DDC CARD DISPLAY */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start print:p-0 print:bg-white" >
        <div 
          className="print-area w-full font-jakarta flex flex-col items-center origin-top transition-transform duration-200 ease-in-out" 
          style={{ transform: `scale(${activeZoom})`, marginBottom: `${(activeZoom - 1) * 100}px`, '--font-scale': fontScale }}
        >
            {cards.map((card) => {
                const isActive = card.id === activeCardId;
                
                // Bij PDF generatie laten we de juiste kaarten zien aan html2canvas
                const isGeneratingThis = isGeneratingPDF && (pdfMode === 'all' || isActive);
                const visibilityClass = isActive || isGeneratingThis ? "block print:block" : "hidden print:hidden";

                return (
                <div key={card.id} className={`print-page w-full max-w-[1100px] ${visibilityClass} mb-8 print:mb-0`}>
                    
                    {/* Het element dat de PDF in gaat */}
                    <div id={`pdf-card-${card.id}`} className="bg-white rounded-2xl flex flex-col relative shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-slate-200 print:border-2 print:border-slate-800 print:shadow-none min-h-[778px] print:h-[96vh] print:rounded-2xl print:overflow-hidden">
                        
                        <div className="flex justify-between items-center p-6 lg:px-10 bg-slate-900 text-white rounded-t-[14px] print:rounded-t-[14px]">
                            <div className="flex items-center gap-6">
                                <div className="bg-sky-500/20 text-sky-300 border border-sky-400/30 px-4 py-1.5 rounded-md flex flex-col items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5 text-sky-300">DDC-ID</span>
                                    <span className="text-xl font-bold leading-none">{card.id}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1">Procesblok</p>
                                    <h1 className="text-2xl font-black tracking-tight">{card.procesblok || <span className="opacity-30 italic">Nog geen naam...</span>}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 lg:p-8 flex flex-col gap-5 bg-white flex-1">
                            <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 mb-4 ml-1">1. Probleem & Oorzaak</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                                    <Section icon={AlertTriangle} title="Knelpunten" accentClass="text-orange-600" iconBg="border-orange-200">
                                        <ul className="space-y-1.5">{renderList(card.knelpunten)}</ul>
                                    </Section>
                                    <Section icon={Search} title="Vermoede oorzaak" accentClass="text-amber-600" iconBg="border-amber-200">
                                        <ul className="space-y-1.5">{renderList(card.vermoedeOorzaak)}</ul>
                                    </Section>
                                </div>
                            </div>

                            <div className="bg-blue-50/40 rounded-xl border border-blue-100 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-4 ml-1">2. Huidige Situatie & Data</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                                    <Section icon={Wrench} title="Workarounds (As-Is)" accentClass="text-sky-600" iconBg="border-sky-200">
                                        <ul className="space-y-1.5">{renderList(card.workarounds)}</ul>
                                    </Section>
                                    <Section icon={Database} title="Minimal Viable Dataset" accentClass="text-blue-600" iconBg="border-blue-200">
                                        <ul className="space-y-1.5">{renderList(card.minimalViableDataset)}</ul>
                                    </Section>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4 ml-1">3. Ontwerpprincipes (To-Be)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                                    <Section icon={Waypoints} title="Procesniveau" accentClass="text-slate-600" iconBg="border-slate-300">
                                        <ul className="space-y-1.5">{renderList(card.ontwerpProces)}</ul>
                                    </Section>
                                    <Section icon={MonitorSmartphone} title="Systeemniveau" accentClass="text-slate-600" iconBg="border-slate-300">
                                        <ul className="space-y-1.5">{renderList(card.ontwerpSysteem)}</ul>
                                    </Section>
                                    <Section icon={Binary} title="Dataniveau" accentClass="text-slate-600" iconBg="border-slate-300">
                                        <ul className="space-y-1.5">{renderList(card.ontwerpData)}</ul>
                                    </Section>
                                </div>
                            </div>

                            <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 p-5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-4 ml-1">4. Opties & Richtingen</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                                    <Section icon={CheckCircle2} title="ARISE Precisie" accentClass="text-emerald-600" iconBg="border-emerald-300 bg-emerald-50">
                                        <ul className="space-y-1.5 text-slate-800 font-semibold">{renderList(card.arisePrecisie)}</ul>
                                    </Section>
                                    <Section icon={RefreshCw} title="ARISE Harmony" accentClass="text-violet-600" iconBg="border-violet-300 bg-violet-50">
                                        <ul className="space-y-1.5 text-slate-800 font-semibold">{renderList(card.ariseHarmony)}</ul>
                                    </Section>
                                </div>
                            </div>
                        </div>

                        {/* NIEUWE FOOTER (Besluit & Opmerkingen) */}
                        <div className="px-6 lg:px-10 py-5 bg-slate-50 border-t border-slate-200 rounded-b-[14px] print:rounded-b-[14px] flex flex-col gap-4 mt-auto">
                            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
                                
                                {/* Linker deel: Knoppen Precisie/Harmony */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Gekozen Ontwerp</span>
                                    <div className="flex gap-2.5">
                                        <button onClick={() => handleChange(card.id, 'gekozenRichting', 'precisie')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-widest transition-all ${card.gekozenRichting === 'precisie' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                                            {card.gekozenRichting === 'precisie' && <Check className="w-3.5 h-3.5" strokeWidth={4} />} Precisie
                                        </button>
                                        <button onClick={() => handleChange(card.id, 'gekozenRichting', 'harmony')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-widest transition-all ${card.gekozenRichting === 'harmony' ? 'bg-violet-500 border-violet-500 text-white shadow-md shadow-violet-200' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'}`}>
                                            {card.gekozenRichting === 'harmony' && <Check className="w-3.5 h-3.5" strokeWidth={4} />} Harmony
                                        </button>
                                    </div>
                                </div>

                                {/* Rechter deel: Opmerkingen vrij tekstveld */}
                                <div className="flex flex-col flex-1 w-full text-left">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">Opmerkingen / Toelichting</label>
                                    <textarea 
                                      value={card.opmerkingen || ""} 
                                      onChange={(e) => handleChange(card.id, 'opmerkingen', e.target.value)} 
                                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-semibold text-slate-700 resize-none outline-none focus:ring-2 focus:ring-sky-500/50 transition-all overflow-hidden" 
                                      placeholder="Typ hier eventuele opmerkingen of toelichting bij het besluit..."
                                      rows="3"
                                    ></textarea>
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