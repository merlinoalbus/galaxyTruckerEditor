# Analisi Modularizzazione Codebase

## 1. FILE MONOLITICI IDENTIFICATI (>400 righe)

### File critici da modularizzare:
1. **useBlockManipulation.ts** - 1189 righe ⚠️ CRITICO
2. **translations.ts** - 2118 righe ⚠️ CRITICO  
3. **BlockConfig.ts** - 555 righe
4. **blockColors.ts** - 404 righe (borderline)

### Altri file potenzialmente problematici (non urgenti):
- useScriptManagement.ts - 381 righe
- IfRenderer.tsx - 351 righe
- GameDataService.ts - 345 righe

## 2. ANALISI DETTAGLIATA: useBlockManipulation.ts

### Struttura attuale (1189 righe):
Il file contiene un singolo hook monolitico con molteplici responsabilità mescolate:

#### A. **Validazioni** (righe ~11-234, 853-1068, 1070-1179)
- `blockEndsWithAsk` - verifica terminazione con ASK
- `canInsertMenuAfterBlock` - validazione MENU
- `validateBlockInsertion` - validazione inserimento blocchi
- `validateAllBlocks` - validazione globale
- `getDropErrorMessage` - messaggi errore per drag&drop

#### B. **Ricerca e Navigazione** (righe ~5-142, 451-504, 629-682, 792-845, 1073-1126)
- `getLastBlock` - helper per ultimo blocco
- `findBlockBeforeContainer` - ricerca blocco precedente
- `findContainer` - ricerca container (DUPLICATA 4 volte!)

#### C. **Manipolazione Blocchi** (righe ~236-787)
- `updateBlockRecursive` - aggiornamento ricorsivo
- `removeBlockRecursive` - rimozione ricorsiva  
- `addBlockAtIndex` - inserimento a indice specifico
- `addBlockToContainer` - inserimento in container

#### D. **Validazione Drop** (righe ~789-851, 1070-1179)
- `canDropBlock` - verifica permessi drop
- `getDropErrorMessage` - messaggi errore specifici

### PROBLEMI IDENTIFICATI:
1. **Codice duplicato massiccio**: La funzione `findContainer` è duplicata 4 volte identica!
2. **Responsabilità mescolate**: Validazione, manipolazione e ricerca nello stesso file
3. **Difficile da testare**: Troppe dipendenze interne
4. **Difficile da mantenere**: Modifiche richiedono comprensione di 1189 righe

## 3. PROPOSTA DI MODULARIZZAZIONE

### STRUTTURA PROPOSTA:

```
src/hooks/CampaignEditor/VisualFlowEditor/
├── useBlockManipulation.ts (50-100 righe) - Hook principale che compone i moduli
└── blockManipulation/
    ├── index.ts - Re-export pubblici
    ├── validation/
    │   ├── index.ts
    │   ├── blockValidators.ts - Validatori specifici per tipo
    │   ├── menuValidation.ts - Logica validazione MENU
    │   ├── askValidation.ts - Logica validazione ASK
    │   ├── containerValidation.ts - BUILD/FLIGHT nesting
    │   └── validationMessages.ts - Messaggi di errore
    ├── operations/
    │   ├── index.ts
    │   ├── updateOperations.ts - updateBlockRecursive
    │   ├── removeOperations.ts - removeBlockRecursive
    │   ├── insertOperations.ts - addBlockAtIndex, addBlockToContainer
    │   └── blockTraversal.ts - Logica di attraversamento albero
    ├── search/
    │   ├── index.ts
    │   ├── blockSearch.ts - findContainer (UNIFICATA), findBlockBeforeContainer
    │   └── searchHelpers.ts - getLastBlock, altri helper
    └── types/
        ├── index.ts
        └── blockTypes.ts - Tipi TypeScript condivisi
```

### PIANO DI IMPLEMENTAZIONE DETTAGLIATO:

#### FASE 1: Estrazione modulo Search (elimina duplicazione)
1. Creare `blockManipulation/search/blockSearch.ts`
2. Estrarre `findContainer` (unificare le 4 copie)
3. Estrarre `findBlockBeforeContainer`
4. Estrarre `getLastBlock` in `searchHelpers.ts`
5. Aggiornare import in useBlockManipulation

#### FASE 2: Estrazione modulo Validation
1. Creare struttura validation/
2. Estrarre `blockEndsWithAsk` → `blockValidators.ts`
3. Estrarre logica MENU → `menuValidation.ts`
4. Estrarre logica ASK → `askValidation.ts`
5. Estrarre logica BUILD/FLIGHT → `containerValidation.ts`
6. Estrarre `validateBlockInsertion`, `validateAllBlocks`
7. Estrarre messaggi → `validationMessages.ts`

#### FASE 3: Estrazione modulo Operations
1. Creare struttura operations/
2. Estrarre `updateBlockRecursive` → `updateOperations.ts`
3. Estrarre `removeBlockRecursive` → `removeOperations.ts`
4. Estrarre `addBlockAtIndex`, `addBlockToContainer` → `insertOperations.ts`
5. Estrarre logica comune traversal → `blockTraversal.ts`

#### FASE 4: Ricomposizione Hook
1. Riscrivere `useBlockManipulation.ts` per usare i moduli
2. Esporre solo l'interfaccia pubblica
3. ~50-100 righe totali

## 4. ALTRI FILE DA MODULARIZZARE

### translations.ts (2118 righe)
**Proposta**: Splittare per lingua o per sezione funzionale
```
locales/
├── index.ts
├── it/
│   ├── common.ts
│   ├── campaignEditor.ts
│   └── errors.ts
├── en/
│   └── ...
```

### BlockConfig.ts (555 righe)
**Proposta**: Splittare per categoria di blocchi
```
config/
├── index.ts
├── commandBlocks.ts
├── containerBlocks.ts
├── ifBlocks.ts
└── specialBlocks.ts
```

### blockColors.ts (404 righe)
**Proposta**: Già abbastanza organizzato, ma si potrebbe:
```
blockColors/
├── index.ts
├── generalCommands.ts
├── constructs.ts
├── special.ts
└── colorUtils.ts
```

## 5. VANTAGGI DELLA MODULARIZZAZIONE

1. **Manutenibilità**: File piccoli e focalizzati (max 200-300 righe)
2. **Testabilità**: Ogni modulo testabile indipendentemente
3. **Riusabilità**: Moduli utilizzabili in altri contesti
4. **Performance**: Tree-shaking migliore
5. **Collaborazione**: Meno conflitti git
6. **Comprensibilità**: Ogni file ha una singola responsabilità

## 6. PRIORITÀ DI INTERVENTO

1. **URGENTE**: useBlockManipulation.ts - Impatto alto, complessità alta
2. **IMPORTANTE**: translations.ts - Impatto medio, complessità bassa
3. **NICE TO HAVE**: BlockConfig.ts, blockColors.ts - Impatto basso

## 7. STIMA TEMPI

- useBlockManipulation.ts: 2-3 ore
- translations.ts: 1 ora
- BlockConfig.ts: 30 minuti
- blockColors.ts: 30 minuti

**TOTALE**: 4-5 ore di refactoring

## 8. RISCHI E MITIGAZIONI

**Rischi**:
- Rottura funzionalità esistenti
- Import circolari
- Performance degradata

**Mitigazioni**:
- Test approfonditi dopo ogni fase
- Verificare import/export
- Profiling performance pre/post