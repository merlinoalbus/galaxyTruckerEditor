import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Monitor } from 'lucide-react';
import { ParsedMetacode, ViewportData, generateExtendedViewportCode } from '../metacodeParser';
interface ViewportMetacodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  metacode: ParsedMetacode | null;
  onSave: (newMetacode: string) => void;
  textContext?: string;
  mousePosition?: { x: number; y: number } | null;
}

export const ViewportMetacodeModal: React.FC<ViewportMetacodeModalProps> = ({
  isOpen,
  onClose,
  metacode,
  onSave,
  textContext = '',
  mousePosition
}) => {
  const [mobile, setMobile] = useState('');
  const [desktop, setDesktop] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  // Preset suggeriti per viewport
  const presets = [
    { label: 'Mobile/Desktop', mobile: 'Mobile', desktop: 'Desktop' },
    { label: 'App/Web', mobile: 'App', desktop: 'Web' },
    { label: 'Touch/Click', mobile: 'Touch', desktop: 'Click' },
    { label: 'Phone/Computer', mobile: 'Phone', desktop: 'Computer' },
    { label: 'Small/Large', mobile: 'Small', desktop: 'Large' },
  ];

  useEffect(() => {
    if (!isOpen) return;
    
    if (mousePosition) {
      // Dimensioni approssimative della modale
      const modalWidth = 240; // w-60 = 15rem = 240px
      const modalHeight = 280; // più alta per i preset
      
      // Centra la modale rispetto al cursore
      let x = mousePosition.x - (modalWidth / 2);
      let y = mousePosition.y - (modalHeight / 2);
      
      // Verifica che non esca dai bordi dello schermo
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Assicurati che non esca dai bordi
      if (x < 10) {
        x = 10;
      } else if (x + modalWidth > viewportWidth - 10) {
        x = viewportWidth - modalWidth - 10;
      }
      
      if (y < 10) {
        y = 10;
      } else if (y + modalHeight > viewportHeight - 10) {
        y = viewportHeight - modalHeight - 10;
      }
      
      setPosition({ x, y });
    } else {
      // Centra se non c'è mousePosition
      const centerPos = { 
        x: window.innerWidth / 2 - 120, 
        y: window.innerHeight / 2 - 150 
      };
      setPosition(centerPos);
    }
  }, [isOpen, mousePosition]);

  useEffect(() => {
    if (metacode && metacode.type === 'viewport') {
      const data = metacode.data as ViewportData;
      // Ricostruisci i valori completi con prefisso e suffisso
      const prefix = metacode.prefix || '';
      const suffix = data.suffix || '';
      setMobile(prefix + (data.mobile || '') + suffix);
      setDesktop(prefix + (data.desktop || '') + suffix);
    } else {
      setMobile('');
      setDesktop('');
    }
  }, [metacode]);

  const handleSave = () => {
    // Usa sempre generateExtendedViewportCode che gestisce automaticamente i suffissi comuni
    const newCode = generateExtendedViewportCode(mobile, desktop);
    onSave(newCode);
    onClose();
  };

  const handlePresetClick = (preset: { mobile: string; desktop: string }) => {
    setMobile(preset.mobile);
    setDesktop(preset.desktop);
  };

  const hasValidInput = mobile || desktop;
  // Genera l'anteprima con gestione automatica dei suffissi comuni
  const preview = hasValidInput 
    ? generateExtendedViewportCode(mobile, desktop)
    : '[v(...|...)]';

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Modale - posizionata vicino al click */}
      <div 
        className="fixed z-[9999]"
        style={position ? {
          left: `${position.x}px`,
          top: `${position.y}px`
        } : {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-slate-900 rounded-xl shadow-2xl w-60 border border-slate-700 overflow-hidden max-h-[400px] overflow-y-auto">
        {/* Header compatto con gradiente verde-blu */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-3 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Monitor className="w-3 h-3 text-white" />
              <h3 className="text-xs font-semibold text-white">
                Viewport Adaptation
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-2">
          {/* Layout come da specifica: Label verticale | Input orizzontale */}
          <div className="space-y-1.5">
            {/* Riga Mobile */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-green-400 w-14 text-right">
                Mobile:
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder=""
              />
            </div>

            {/* Riga Desktop */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-blue-400 w-14 text-right">
                Desktop:
              </label>
              <input
                type="text"
                value={desktop}
                onChange={(e) => setDesktop(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
              />
            </div>
          </div>

          {/* Divider */}
          <div className="my-1.5 border-t border-slate-700"></div>

          {/* Preset suggeriti */}
          <div className="px-2 py-1">
            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Preset:</p>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-gray-300 rounded hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="my-1.5 border-t border-slate-700"></div>
          
          {/* Risultato */}
          <div className="px-2 py-1">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Result:</p>
            <p className={`text-[11px] font-mono ${hasValidInput ? 'text-green-400' : 'text-yellow-400'}`}>
              {preview}
            </p>
          </div>

          {/* Divider */}
          <div className="my-1.5 border-t border-slate-700"></div>

          {/* Pulsanti azione */}
          <div className="flex gap-1.5">
            <button
              onClick={onClose}
              className="flex-1 px-2 py-1 text-[10px] text-gray-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!mobile || !desktop}
              className="flex-1 px-2 py-1 text-[10px] bg-gradient-to-r from-green-500 to-blue-500 text-white rounded hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Apply
            </button>
          </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};