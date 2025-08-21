import React from 'react';
import { useTranslation } from '@/locales';

type Props = {
  block: any;
  updateBlock: (patch: Partial<any>) => void;
  availableScripts?: string[];
};

export const BuildingHelpScriptBlock: React.FC<Props> = ({ block, updateBlock, availableScripts = [] }) => {
  const { t } = useTranslation();
  const value = block.parameters?.value ?? 0;
  const script = block.parameters?.script ?? '';

  const compact = (t as any)('visualFlowEditor.header.compact.buildingHelp')
    .replace('{value}', String(value))
    .replace('{script}', script || '-');

  const navigate = () => {
    if (script) {
      window.dispatchEvent(new CustomEvent('VFE:navigateToScript', { detail: { scriptName: script, parentBlockId: block.id } }));
    }
  };

  return (
    <div className="vfe-block vfe-help">
      <div className="vfe-block-header">
        <div className="vfe-title">{(t as any)('visualFlowEditor.command.buildingHelpScript')}</div>
        <div className="vfe-compact">{compact}</div>
        <button className="vfe-btn" onClick={navigate} title={(t as any)('visualFlowEditor.header.navigateToScript')}>↪</button>
      </div>
      <div className="vfe-block-body grid grid-cols-3 gap-2 items-center">
        <label className="col-span-1">{(t as any)('visualFlowEditor.command.script')}</label>
        <select
          className="col-span-2 vfe-input"
          value={script}
          onChange={(e) => updateBlock({ parameters: { ...block.parameters, script: e.target.value } })}
        >
          <option value="">{(t as any)('visualFlowEditor.command.selectScript')}</option>
          {availableScripts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="col-span-1">{(t as any)('visualFlowEditor.command.value')}</label>
        <input
          type="number"
          className="col-span-2 vfe-input"
          value={value}
          min={0}
          onChange={(e) => updateBlock({ parameters: { ...block.parameters, value: parseInt(e.target.value || '0', 10) } })}
        />
      </div>
    </div>
  );
};
