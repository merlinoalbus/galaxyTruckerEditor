# VisualFlowEditor - Versione 2025-01-04

## Motivo dello spostamento in OLD

Questa versione del VisualFlowEditor è stata spostata in OLD perché:

1. **Validazione incompleta**: La validazione degli elementi e dei blocchi non era perfetta e completa
2. **UI confusionaria**: Menu Add Component statico che mostrava sempre tutti i componenti senza considerare lo stato del flow
3. **Interazione drag-and-drop problematica**: Sistema di ancoraggio poco chiaro con punti di inserimento confusi
4. **Mancanza di integrazione mouse**: Non era integrato al 100% con gli eventi del mouse per drag and drop fluido
5. **Blocchi non implementati**: Alcuni blocchi individuati dall'analisi degli script non erano gestiti

## Architettura precedente

La versione precedente seguiva la struttura mirror corretta ma aveva problemi di implementazione:
- VisualFlowEditor.tsx: Componente principale
- FlowCanvas/FlowCanvas.tsx: Canvas di disegno
- FlowHeader/FlowHeader.tsx: Header del flow
- useVisualFlowEditor.ts: Hook principale
- Vari services e types

## Componenti riutilizzabili

Da questa versione si possono recuperare:
- Struttura base dei tipi
- Hook useCharacterStates (da OLD/FlowEditor)
- Blocchi base (da OLD/FlowEditor/blocks)
- MultiLanguageTextEditor e altre utility

## Nuova implementazione

La nuova implementazione dovrà:
1. Implementare validazione completa basata su stato del flow
2. Sistema drag-and-drop con punti di ancoraggio visivi chiari
3. Menu Add Component contestuale filtrato per stato
4. Integrazione completa con tracciamento caratteri
5. Gestione corretta del branching (IF/ELSE, Menu)