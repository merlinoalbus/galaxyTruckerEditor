import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { ParsedMetacode, generateExtendedNumberCode, NumberData } from '../metacodeParser';
import { useTranslation } from '@/locales';

interface NumberMetacodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  metacode: ParsedMetacode | null;
  onSave: (newMetacode: string) => void;
  textContext?: string;
  mousePosition?: { x: number; y: number } | null;
}

export const NumberMetacodeModal: React.FC<NumberMetacodeModalProps> = ({
  isOpen,
  onClose,
  metacode,
  onSave,
  textContext = '',
  mousePosition
}) => {
  const { t } = useTranslation();
  const [quantifiers, setQuantifiers] = useState<Array<{threshold: number; text: string}>>([
    { threshold: 1, text: '' },
    { threshold: 2, text: '' }
  ]);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (metacode && metacode.type === 'number') {
      const data = metacode.data as NumberData;
      const prefix = metacode.prefix || '';
      const suffix = data.suffix || '';
      
      if (data.quantifiers && data.quantifiers.length > 0) {
        // Ricostruisci i quantificatori con prefisso e suffisso
        setQuantifiers(data.quantifiers.map(q => ({
          threshold: q.threshold,
          text: prefix + q.text + suffix
        })));
      } else {
        // Default per nuovo metacodice
        setQuantifiers([
          { threshold: 1, text: '' },
          { threshold: 2, text: '' }
        ]);
      }
    } else {
      // Reset per nuovo metacodice
      setQuantifiers([
        { threshold: 1, text: '' },
        { threshold: 2, text: '' }
      ]);
    }
  }, [metacode]);

  useEffect(() => {
    if (!isOpen) return; // Non fare nulla se la modale non è aperta
    
    if (mousePosition) {
      // Dimensioni approssimative della modale
      const modalWidth = 300; // Stima per number modal
      const modalHeight = 350; // Stima per number modal (più alta per lista quantificatori)
      
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
        x: window.innerWidth / 2 - 150, 
        y: window.innerHeight / 2 - 175 
      };
      setPosition(centerPos);
    }
  }, [isOpen, mousePosition]);

  const handleSave = () => {
    // Filtra quantificatori validi e genera il codice
    const validQuantifiers = quantifiers.filter(q => q.text.trim() !== '');
    if (validQuantifiers.length > 0) {
      const newCode = generateExtendedNumberCode(validQuantifiers);
      onSave(newCode);
    }
    onClose();
  };
  
  const addQuantifier = () => {
    const lastThreshold = quantifiers[quantifiers.length - 1]?.threshold || 0;
    setQuantifiers([...quantifiers, { threshold: lastThreshold + 1, text: '' }]);
  };
  
  const removeQuantifier = (index: number) => {
    if (quantifiers.length > 1) {
      setQuantifiers(quantifiers.filter((_, i) => i !== index));
    }
  };
  
  const updateQuantifier = (index: number, field: 'threshold' | 'text', value: string | number) => {
    const updated = [...quantifiers];
    if (field === 'threshold') {
      updated[index].threshold = parseInt(String(value)) || 0;
    } else {
      updated[index].text = String(value);
    }
    setQuantifiers(updated);
  };

  const hasValidInput = quantifiers.some(q => q.text.trim() !== '');
  // Genera l'anteprima ottimizzata
  const validQuantifiers = quantifiers.filter(q => q.text.trim() !== '');
  const preview = validQuantifiers.length > 0
    ? generateExtendedNumberCode(validQuantifiers)
    : '[n(1:...|2:...)]';

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
            <div className="bg-gradient-to-r from-green-600 to-orange-600 px-3 py-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-white">
                  {t('visualFlowEditor.metacode.numberMetacode')}
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
              {/* Lista di quantificatori dinamici */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {quantifiers.map((q, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <input
                      type="number"
                      value={q.threshold}
                      onChange={(e) => updateQuantifier(index, 'threshold', e.target.value)}
                      className="w-12 px-1 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                    <span className="text-xs text-gray-400">:</span>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuantifier(index, 'text', e.target.value)}
                      className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder={t('visualFlowEditor.metacode.textPlaceholder')}
                      autoFocus={index === 0}
                    />
                    {quantifiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuantifier(index)}
                        className="p-0.5 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Pulsante per aggiungere quantificatore */}
                <button
                  type="button"
                  onClick={addQuantifier}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs text-green-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('visualFlowEditor.metacode.addThreshold')}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="my-1.5 border-t border-slate-700"></div>
              
              {/* Risultato */}
              <div className="px-2 py-1">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('visualFlowEditor.metacode.result')}:</p>
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
                  {t('visualFlowEditor.metacode.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasValidInput}
                  className="flex-1 px-2 py-1 text-[10px] bg-gradient-to-r from-green-500 to-orange-500 text-white rounded hover:from-green-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {t('visualFlowEditor.metacode.apply')}
                </button>
              </div>
            </div>
          </div>
      </div>
    </>,
    document.body
  );
};