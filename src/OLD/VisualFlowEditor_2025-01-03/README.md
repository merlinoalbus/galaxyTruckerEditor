# VisualFlowEditor - Deprecated 2025-01-03

## Motivo deprecazione
Il componente VisualFlowEditor non rispettava l'architettura enterprise React TypeScript e presentava i seguenti problemi:

1. **Validazione incompleta**: Le regole di validazione blocchi non erano enforce correttamente
2. **Menu Add Component statico**: Non filtrava i componenti disponibili in base allo stato del flow
3. **UX confusa**: Sistema di inserimento blocchi con pulsanti e menu poco chiari
4. **Drag & drop non implementato**: Mancava la possibilità di spostare blocchi con il mouse
5. **Gestione branching incompleta**: IF/ELSE e Menu non gestivano correttamente i percorsi paralleli
6. **Character state non propagato**: I blocchi Say/Ask non mostravano il personaggio corrente

## Nuova implementazione
Sostituito con un nuovo VisualFlowEditor che:
- Segue l'architettura enterprise con struttura a specchio
- Implementa validazione centralizzata dei blocchi
- Fornisce drag & drop intuitivo con punti di ancoraggio visivi
- Gestisce correttamente il branching (IF/ELSE, Menu)
- Propaga lo stato dei personaggi attraverso il flow
- Filtra dinamicamente i componenti disponibili

## File originale
- VisualFlowEditor.tsx (copiato da src/components/CampaignEditor/)