import React, { useState, useEffect } from 'react';
import { X, Type } from 'lucide-react';
import { useTranslation } from '@/locales';

interface StringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  existingData?: {
    index?: string;
    uppercase?: boolean;
  };
}

export const StringModal: React.FC<StringModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  existingData
}) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(existingData?.index || '');
  const [uppercase, setUppercase] = useState(existingData?.uppercase || false);

  const handleInsert = () => {
    let code = '[s';
    if (index) code += index;
    code += ']';
    if (uppercase) {
      code = code.replace('[s', '[S');
    }
    onInsert(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-4 w-[400px] max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Type className="w-5 h-5" />
{t('visualFlowEditor.metacode.dynamicString')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Info */}
        <div className="mb-4 p-2 bg-slate-900/50 rounded text-xs text-gray-400">
{t('visualFlowEditor.metacode.dynamicStringDescription')}
        </div>

        {/* Form */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
{t('visualFlowEditor.metacode.indexOptional')}
            </label>
            <input
              type="text"
              value={index}
              onChange={(e) => setIndex(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
              placeholder={t('visualFlowEditor.metacode.indexPlaceholder')}
            />
            <div className="text-xs text-gray-500 mt-1">
{t('visualFlowEditor.metacode.stringIndexDescription')}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded border-gray-600 bg-slate-900 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">{t('visualFlowEditor.metacode.uppercase')}</span>
            </label>
            <div className="text-xs text-gray-500 mt-1">
{t('visualFlowEditor.metacode.forceUppercase')}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="text-xs text-gray-500 mb-1">{t('visualFlowEditor.metacode.generatedCode')}</div>
          <code className="text-sm text-green-400 font-mono">
            {uppercase ? '[S' : '[s'}{index}{']'}
          </code>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
{t('visualFlowEditor.metacode.cancel')}
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
{t('visualFlowEditor.metacode.insert')}
          </button>
        </div>
      </div>
    </div>
  );
};