import React, { useEffect, useMemo, useState } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '@/config';
import { useTranslation } from '@/locales';

// Minimal types for coverage API
type PerLanguage = Record<string, { covered: number; missing: number; different: number; totalFields: number; percent: number }>;

type CoverageResponse = {
  success: boolean;
  data: {
    perLanguage: PerLanguage;
    perScript: Array<{
      script: string;
      totalFields: number;
      languages: PerLanguage;
    }>;
  };
};

type ScriptDetailsResponse = {
  success: boolean;
  data: {
    script: string;
    totalFields: number;
    summary: PerLanguage;
    details: Array<{
      path: (number | string)[];
      field: string;
      label: string | null;
  type: string | null;
      en: string;
      values: Record<string, string | undefined>;
    }>;
  }
};

export const TranslationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageResponse['data'] | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>('IT');
  const [onlyMissing, setOnlyMissing] = useState<boolean>(false);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [scriptDetails, setScriptDetails] = useState<ScriptDetailsResponse['data'] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [mergedBlocks, setMergedBlocks] = useState<any[] | null>(null);
  const [saving, setSaving] = useState(false); // kept to disable buttons during ops

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_TRANSLATIONS_COVERAGE}`);
        const json: CoverageResponse = await res.json();
        if (!json.success) throw new Error('coverage failed');
        setCoverage(json.data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedScript) return;
      try {
        setScriptDetails(null);
        setMergedBlocks(null);
        const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_TRANSLATIONS_DETAILS(selectedScript)}`);
        const json: ScriptDetailsResponse = await res.json();
        if (!json.success) throw new Error('details failed');
        setScriptDetails(json.data);
        // Carica anche i blocchi multilingua completi per poter salvare
        try {
          const resp2 = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPT_BY_NAME(selectedScript)}?multilingua=true&format=blocks`);
          const j2 = await resp2.json();
          if (j2?.success && Array.isArray(j2.data?.blocks)) {
            setMergedBlocks(j2.data.blocks);
          }
        } catch {}
      } catch (e) {
        setScriptDetails(null);
      }
    };
    loadDetails();
  }, [selectedScript]);

  const scriptsSorted = useMemo(() => {
    if (!coverage) return [] as CoverageResponse['data']['perScript'];
    const list = [...coverage.perScript];
    list.sort((a, b) => {
      const pa = a.languages[selectedLang]?.percent ?? -1;
      const pb = b.languages[selectedLang]?.percent ?? -1;
      return pa - pb; // asc by coverage
    });
    return list;
  }, [coverage, selectedLang]);

  if (loading) return <div className="p-6 text-gray-300">{t('common.loading')}</div>;
  if (error) return <div className="p-6 text-red-400">{t('common.error')}: {error}</div>;
  if (!coverage) return <div className="p-6 text-gray-400">{t('common.noData')}</div>;

  const langs = Object.keys(coverage.perLanguage);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-white font-semibold mb-2">Translations Overview</h2>
        <div className="flex flex-wrap gap-3">
          {langs.map((lang) => {
            const d = coverage.perLanguage[lang];
            return (
              <div key={lang} className={`px-3 py-2 rounded border text-sm ${d.percent >= 90 ? 'border-green-600 text-green-300' : d.percent >= 60 ? 'border-yellow-600 text-yellow-300' : 'border-red-700 text-red-300'}`}>
                <span className="font-bold mr-2">{lang}</span>
                <span>{d.percent}%</span>
                <span className="ml-2 text-xs text-gray-400">({d.covered}/{d.totalFields})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <label className="text-gray-300 text-sm">Lingua</label>
        <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="bg-slate-800 text-gray-200 border border-slate-700 rounded px-2 py-1">
          {langs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-gray-300 text-sm">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Solo mancanti
        </label>
      </div>

      {/* Scripts table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-gray-300">
            <tr>
              <th className="px-3 py-2">Script</th>
              <th className="px-3 py-2">% {selectedLang}</th>
              <th className="px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {scriptsSorted.map(s => {
              const d = s.languages[selectedLang];
              if (!d) return null;
              // Show in Solo mancanti only if completion < 100
              if (onlyMissing && (d.percent >= 100)) return null;
              const isOpen = selectedScript === s.script;
              return (
                <>
                  <tr key={s.script} className="hover:bg-slate-700/40">
                    <td className="px-3 py-2 text-gray-200">{s.script}</td>
                    <td className="px-3 py-2 text-gray-300">{d.percent}% <span className="text-xs text-gray-500">({d.covered}/{d.totalFields})</span></td>
                    <td className="px-3 py-2 text-gray-300">
                      <button className="btn-primary mr-2" onClick={() => setSelectedScript(isOpen ? null : s.script)}>{isOpen ? 'Nascondi' : 'Dettagli'}</button>
                      <button className="btn-secondary" onClick={() => {
                        // Navigate to VFE tab with event (script-level only)
                        window.dispatchEvent(new CustomEvent('navigateToVisualFlow', { detail: { scriptName: s.script } as any }));
                      }}>Apri in VFE</button>
                    </td>
                  </tr>
                  {isOpen && scriptDetails && scriptDetails.script === s.script && (
                    <tr className="bg-slate-900/40">
                      <td colSpan={3} className="px-3 py-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-300 text-sm">Copertura {selectedLang}: {scriptDetails.summary[selectedLang]?.percent ?? 0}%</div>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={saving || !scriptDetails}
                                className={`btn-secondary ${saving || !scriptDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                                onClick={async () => {
                                  if (!scriptDetails) return;
                                  try {
                                    setSaving(true);
                                    const items = scriptDetails.details.map((d) => ({
                                      textEN: d.en,
                                      metacodesDetected: (d.en.match(/\[[^\]]+\]/g) || [])
                                    }));
                                    const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE_BATCH}`, {
                                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ items, langTarget: selectedLang })
                                    });
                                    const j = await resp.json();
                                    if (!resp.ok || !j?.success) throw new Error(j?.message || 'batch failed');
                                    const suggestions: string[] = j.data?.suggestions || [];
                                    // Popola tutte le inputbox
                                    const newEdits: Record<string, string> = { ...edits };
                                    scriptDetails.details.forEach((_, idx) => {
                                      const key = `${scriptDetails.script}|${idx}|${selectedLang}`;
                                      const sug = suggestions[idx];
                                      if (typeof sug === 'string' && sug.length > 0) newEdits[key] = sug;
                                    });
                                    setEdits(newEdits);
                                  } catch (e: any) {
                                    alert(e?.message || 'Impossibile generare suggerimenti in batch');
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                              >Suggerisci All (AI)</button>
                            </div>
                          </div>
                          <div className="max-h-72 overflow-auto border border-slate-700 rounded">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-900 text-gray-300">
                                <tr>
                                  <th className="px-3 py-2">Label</th>
                                  <th className="px-3 py-2">Campo</th>
                                  <th className="px-3 py-2">EN</th>
                                  <th className="px-3 py-2">{selectedLang}</th>
                                  <th className="px-3 py-2">Azioni</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700">
                                {scriptDetails.details.map((d, idx) => {
                                  const key = `${scriptDetails.script}|${idx}|${selectedLang}`;
                                  const initial = (d.values[selectedLang] || '');
                                  const targetVal = edits[key] !== undefined ? edits[key] : initial;
                                  const isMissing = !targetVal || targetVal === d.en;
                                  const isDifferent = !!targetVal && targetVal !== d.en;
                                  return (
                                    <tr key={idx} className={`${isMissing ? 'bg-red-900/20' : isDifferent ? 'bg-yellow-900/20' : ''}`}>
                                      <td className="px-3 py-2 text-gray-300">{d.label || '-'}</td>
                                      <td className="px-3 py-2 text-gray-400">{d.type || '-'}</td>
                                      <td className="px-3 py-2 text-gray-200">{d.en}</td>
                                      <td className="px-3 py-2 text-gray-200">
                                        <input
                                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-gray-200"
                      value={targetVal || (d.values[selectedLang] || '')}
                                          onChange={(e) => setEdits(prev => ({ ...prev, [key]: e.target.value }))}
                                          placeholder="Inserisci traduzione"
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-gray-300">
                                        <button className="btn-primary" onClick={async () => {
                                          try {
                                            const metacodes = (d.en.match(/\[[^\]]+\]/g) || []);
                                            const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE}`, {
                                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ textEN: d.en, langTarget: selectedLang, metacodesDetected: metacodes })
                                            });
                                            const j = await res.json();
                                            if (!j.success) throw new Error('ai translate failed');
                                            const suggestion = j.data?.suggestion as string | undefined;
                                            if (suggestion) setEdits(prev => ({ ...prev, [key]: suggestion }));
                                            else alert('Nessun suggerimento disponibile');
                                          } catch (e) {
                                            alert('Impossibile generare suggerimento');
                                          }
                                        }}>Suggerisci (AI)</button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};
