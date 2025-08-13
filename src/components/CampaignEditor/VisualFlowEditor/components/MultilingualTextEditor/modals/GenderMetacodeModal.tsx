import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { ParsedMetacode, generateExtendedGenderCode } from '../metacodeParser';

interface GenderMetacodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  metacode: ParsedMetacode | null;
  onSave: (newMetacode: string) => void;
  textContext?: string;
  mousePosition?: { x: number; y: number } | null;
}

export const GenderMetacodeModal: React.FC<GenderMetacodeModalProps> = ({
  isOpen,
  onClose,
  metacode,
  onSave,
  textContext = '',
  mousePosition
}) => {
  const [male, setMale] = useState('');
  const [female, setFemale] = useState('');
  const [neutral, setNeutral] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return; // Non fare nulla se la modale non è aperta
    
    if (mousePosition) {
      // Le coordinate del mouse sono già relative al viewport (clientX/clientY)
      // Non dobbiamo sottrarre lo scroll!
      
      // Dimensioni approssimative della modale
      const modalWidth = 240; // w-60 = 15rem = 240px
      const modalHeight = 200; // altezza stimata più realistica per 3 input + header + pulsanti
      
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
    if (metacode && metacode.type === 'gender') {
      const data = metacode.data as any;
      // Se c'è un prefisso, ricostruisci i valori completi
      const prefix = metacode.prefix || '';
      setMale(prefix + (data.male || ''));
      setFemale(prefix + (data.female || ''));
      setNeutral(data.neutral ? prefix + data.neutral : '');
    } else {
      setMale('');
      setFemale('');
      setNeutral('');
    }
  }, [metacode]);

  const handleSave = () => {
    // Usa generateExtendedGenderCode per ottimizzare automaticamente
    const newCode = generateExtendedGenderCode(male, female, neutral || undefined);
    onSave(newCode);
    onClose();
  };

  const hasValidInput = male || female;
  // Genera l'anteprima ottimizzata
  const preview = hasValidInput 
    ? generateExtendedGenderCode(male, female, neutral || undefined)
    : '[g(...|...)]';

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
        {/* Header compatto con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-pink-600 px-3 py-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-white">
              Metacodice Genere
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-2">
          {/* Layout come da specifica ASCII: Label verticale | Input orizzontale */}
          <div className="space-y-1.5">
            {/* Riga Maschile */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-blue-400 w-14 text-right">
                Maschile:
              </label>
              <input
                type="text"
                value={male}
                onChange={(e) => setMale(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
              />
            </div>

            {/* Riga Femminile */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-pink-400 w-14 text-right">
                Femminile:
              </label>
              <input
                type="text"
                value={female}
                onChange={(e) => setFemale(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                placeholder=""
              />
            </div>

            {/* Riga Neutro */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-gray-400 w-14 text-right">
                Neutro:
              </label>
              <input
                type="text"
                value={neutral}
                onChange={(e) => setNeutral(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder=""
              />
            </div>
          </div>

          {/* Divider */}
          <div className="my-1.5 border-t border-slate-700"></div>
          
          {/* Risultato */}
          <div className="px-2 py-1">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Risultato:</p>
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
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={!male || !female}
              className="flex-1 px-2 py-1 text-[10px] bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded hover:from-blue-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Applica
            </button>
          </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};