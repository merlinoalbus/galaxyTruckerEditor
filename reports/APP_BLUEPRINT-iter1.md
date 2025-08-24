# Galaxy Trucker Editor — Blueprint tecnica (Iterazione 1)

Scopo: creare una prima iterazione del report tecnico esteso che descriva architettura, componenti, data model, flussi di dati e punti critici per refactor.

## Sommario (proposta)
1. Executive summary
2. Architettura generale
3. Frontend: struttura componenti, hooks, types
4. Backend: struttura, parser, API
5. Data model: YAML, immagini, characters
6. Scene simulation & Visual Flow Editor
7. Deploy e Docker
8. Test e QA
9. Roadmap di refactor e technical debt
10. Appendici: file rilevanti, comandi utili

## File analizzati (prima passata)
- `package.json`
- `README.md`
- `docs/METACODE_COMPLETE_ANALYSIS.md` (referenza)
- `docs/API_DOCUMENTATION.md` (referenza)
- `src/utils/CampaignEditor/VisualFlowEditor/sceneSimulation.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/jsonConverter.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/collectAllBlocks.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/blockIdManager.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/blockCleaner.ts`
- `src/components/CampaignEditor/VisualFlowEditor/VisualFlowEditor.tsx`
- `src/hooks/CampaignEditor/VisualFlowEditor/useScriptManagement.ts`
- `src/hooks/CampaignEditor/VisualFlowEditor/useBlockManipulation.ts`
- `docs/CATEGORIZZAZIONE_COMANDI.md`
- `reports/DECK_COMMANDS_AND_SHOWCHAR_ANALYSIS.md`

## Osservazioni iniziali e rischi
- Il progetto è principalmente frontend React + TypeScript. Alcuni moduli server esistono nella cartella `server/`.
- Punti critici: parser degli script, gestione degli asset (immagini), simulazione scene (sceneSimulation.ts), e hook monolitici nel visual flow.
- Mancano test end-to-end completi per il flusso editor visuale.

## Azioni proposte per la prossima iterazione
- Espandere ogni sezione del sommario in sottosezioni tecniche dettagliate.
- Eseguire lettura approfondita dei file elencati e generare diagrammi (architettura, sequence, component boundaries).
- Aggiungere esempi di JSON/YAML e contratti API.

---

_End of iterazione 1 scaffold._
