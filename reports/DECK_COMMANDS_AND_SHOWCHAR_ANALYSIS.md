# Analisi parser/serializer: Deck* e ShowChar

Data: 22/08/2025

Obiettivo: verificare perché alcuni comandi non vengono riconosciuti da parser/serializer e documentarne sintassi e funzionamento. Focus su:

- DeckAddAllCards
- DeckAddCardRound
- DeckAddCardType
- DeckAddRulePosition
- DeckAddRuleRange
- DeckShuffle
- SetSuperCardsCnt
- ShowChar

## Executive summary

- Frontend (FE) deck parser/serializer (`src/utils/FileParser.ts`) supporta solo `TmpDeckLoad` e `DeckAddCardType`. Tutti gli altri comandi Deck elencati non sono implementati: il parser non li riconosce, la serializzazione non li produce. Questo spiega i “mancano” su parse/serialize.
- Lo “ShowChar a volte sì/a volte no” dipende dal Backend (BE) che usa due parser diversi con regole disallineate:
  - `server/src/parsers/blockParser.js` applica una regex stretta e case-sensitive: `^ShowChar\s+(\w+)\s+(left|center|right)$`.
  - `server/src/parsers/scriptParser.js` riconosce `SHOWCHAR` (di fatto tollera il case), accetta parametri opzionali (es. immagine) e non valida rigidamente la posizione.

## Evidenze nel codice

### 1) Deck script parser/serializer (FE)

File: `src/utils/FileParser.ts`

- parseDeckScript: riconosce
  - `SCRIPT <name>`
  - `TmpDeckLoad "<file>"`
  - `DeckAddCardType <flight:int> <cardType:string> <count:int>`
- serializeDeckScript: emette
  - `TmpDeckLoad "<file>"`
  - `DeckAddCardType <flight> <cardType> <count>`

Nessun altro comando Deck è gestito qui. Di conseguenza:
- `DeckAddAllCards`, `DeckAddCardRound`, `DeckAddRulePosition`, `DeckAddRuleRange`, `DeckShuffle`, `SetSuperCardsCnt` non vengono né parsati né serializzati dal FE.

Campioni nel repo che mostrano la sintassi attesa lato gioco (server assets):
- `server/GAMEFOLDER/customScripts/sm_test_deck_scripts.txt`
  - `DeckShuffle`
  - `DeckAddRulePosition 1 slavers 1`
  - `DeckAddRulePosition 1 slavers 2`
  - `DeckAddCardRound 1 6`, `DeckAddCardRound 2 8`, ...
- `server/GAMEFOLDER/customScripts/*deck_scripts.txt`
  - `SetSuperCardsCnt 1 2 3` (spesso ripetuto)

Nota: `DeckAddAllCards` non compare nei sample, quindi la sintassi va confermata dalle specifiche del motore.

### 2) ShowChar: parser/serializer (BE)

Backend
- Parser “block-based” (bidirezionale): `server/src/parsers/blockParser.js`
  - COMMAND_CATALOG: `SHOWCHAR` → pattern `/^ShowChar\s+(\w+)\s+(left|center|right)$/` (case-sensitive, richiede esattamente 2 parametri e una delle 3 posizioni).
- Parser “line-based”: `server/src/parsers/scriptParser.js`
  - Riconosce `SHOWCHAR` anche in maiuscolo, accetta un terzo parametro opzionale (immagine) e non valida rigidamente la posizione (default `center` se mancante).

Effetto pratico: a seconda della rotta/feature che invoca l’uno o l’altro parser, lo stesso script può essere accettato o rifiutato. I casi più comuni di mancato match nel percorso `blockParser` sono: `SHOWCHAR` tutto maiuscolo, posizioni diverse da left|center|right, presenza di un terzo parametro immagine.

Frontend (contesto)
- Tipi FE consentono posizioni extra per SHOWCHAR: `src/types/CampaignEditor/VisualFlowEditor/blocks.types.ts` (top/bottom/lefttop/...); se non esistono lato motore, vanno normalizzate.

## Sintassi e funzionamento (in base alle evidenze)

Di seguito la sintassi inferita/observata. Gli aspetti con “da confermare” derivano dall’assenza di specifica ufficiale nel repo.

1) DeckAddCardType
- Sintassi: `DeckAddCardType <flight:int> <cardType:string> <count:int>`
- Funzione: aggiunge `count` carte del tipo `cardType` al mazzo del volo `flight`.
- Stato parser FE: SUPPORTATO (parse/serialize)

2) DeckShuffle
- Sintassi: `DeckShuffle`
- Funzione: rimescola il mazzo corrente.
- Stato parser FE: NON supportato (da aggiungere in `FileParser.ts`).

3) DeckAddRulePosition
- Sintassi osservata: `DeckAddRulePosition <flight:int> <cardType:string> <position:int>`
- Funzione probabile: impone che una carta di tipo `cardType` appaia a `position` nel mazzo del volo `flight`.
- Stato parser FE: NON supportato.

4) DeckAddRuleRange
- Sintassi attesa: `DeckAddRuleRange <flight:int> <cardType:string> <start:int> <end:int>`
- Funzione probabile: impone che carte di tipo `cardType` cadano in un intervallo di posizioni `[start, end]` nel mazzo del volo `flight`.
- Stato parser FE: NON supportato.

5) DeckAddCardRound
- Sintassi osservata: `DeckAddCardRound <flight:int> <value:int>` (esempi: `1 6`, `2 8`, ...)
- Funzione da confermare: aggiunge carte per un determinato “round/index” del volo; senza specifica ufficiale, è ragionevole trattarlo come posizionamento in una fase/round del mazzo.
- Stato parser FE: NON supportato.

6) DeckAddAllCards
- Sintassi: non presente nei sample; da confermare (probabilmente senza parametri o con `<flight:int>`).
- Funzione attesa: aggiunge tutte le carte disponibili al mazzo (del volo corrente o indicato).
- Stato parser FE: NON supportato.

7) SetSuperCardsCnt
- Sintassi osservata: `SetSuperCardsCnt <cntSTI:int> <cntSTII:int> <cntSTIII:int>`
- Funzione probabile: imposta quante “super cards” includere per ogni volo (I/II/III).
- Stato parser FE: NON supportato.

8) ShowChar
- Sintassi server: `ShowChar <character:word> <position:left|center|right>`
- Funzione: mostra un personaggio in UI nella posizione indicata.
- Note di compatibilità:
  - Case-sensitive su “ShowChar” (il parser server non accetta `SHOWCHAR`).
  - Accetta solo tre posizioni (left/center/right). Il FE oggi permette anche top/bottom/lefttop/... che non verranno riconosciute in import.
  - Il parser FE semplificato non interpreta ShowChar: quando si usa quel percorso, il comando può risultare “sconosciuto”.

## Perché ShowChar “a volte sì/a volte no” (BE)

Cause identificate lato BE:
- Esistono due parser con regole diverse: `blockParser` (regex stretta, case-sensitive) e `scriptParser` (tollerante).
- `blockParser` non accetta `SHOWCHAR` tutto maiuscolo e limita le posizioni a left|center|right; inoltre non ammette un terzo parametro immagine.
- Se la rotta passa dal percorso `blockParser`, i casi sopra falliscono; passando da `scriptParser` invece vengono accettati.

## Azioni consigliate (fix)

1) Uniformare ShowChar nel BE
- In `server/src/parsers/blockParser.js` rendere la regex case-insensitive e accettare un terzo parametro opzionale immagine:
  - da: `/^ShowChar\s+(\w+)\s+(left|center|right)$/`
  - a:  `/^ShowChar\s+(\w+)\s+(left|center|right)(?:\s+(.+))?$/i`
- Allineare le rotte a usare un unico parser (preferibilmente quello aggiornato) per evitare divergenze.
- Valutare se estendere ufficialmente il dominio delle posizioni oppure normalizzare le varianti a {left, center, right}.

2) Frontend
- Limitare le posizioni a {left, center, right} o introdurre un mapping coerente con la normalizzazione lato BE.

2) Implementare i comandi Deck mancanti nel FE
- Aggiornare `src/types/GameTypes.ts` → estendere `DeckCommand` con i nuovi tipi:
  - `DeckAddAllCards`, `DeckAddCardRound`, `DeckAddRulePosition`, `DeckAddRuleRange`, `DeckShuffle`, `SetSuperCardsCnt`.
- Aggiornare `src/utils/FileParser.ts`:
  - parseDeckScript: aggiungere i rami `else if` per ognuno dei comandi con estrazione parametri come da sintassi sopra (per quelli “da confermare”, iniziare con una versione basata sui sample e adattare appena disponibili le specifiche esatte).
  - serializeDeckScript: aggiungere i case per emissione testo.
- Aggiungere test mirati in `__tests__/FileParser.test.ts` per round-trip (parse→serialize) dei nuovi comandi.

3) Test e convalida
- Aggiungere casi di test per `ShowChar` in import/export con posizioni valide e maiuscole diverse (`SHOWCHAR`), una volta resa la regex case-insensitive.
- Aggiungere file sample minimi per i comandi Deck per test di regressione.

## Bozza di mapping parametri (per implementazione)

- DeckAddAllCards
  - parse: `DeckAddAllCards` [opzionale `<flight:int>` se richiesto dal motore]
  - serialize: uguale

- DeckShuffle
  - parse: `DeckShuffle`
  - serialize: `DeckShuffle`

- DeckAddCardRound
  - parse: `DeckAddCardRound <flight:int> <value:int>` (nome campo FE suggerito: `round`)
  - serialize: uguale

- DeckAddRulePosition
  - parse: `DeckAddRulePosition <flight:int> <cardType:string> <position:int>`
  - serialize: uguale

- DeckAddRuleRange
  - parse: `DeckAddRuleRange <flight:int> <cardType:string> <start:int> <end:int>`
  - serialize: uguale

- SetSuperCardsCnt
  - parse: `SetSuperCardsCnt <cntSTI:int> <cntSTII:int> <cntSTIII:int>` (campi suggeriti: `superCntSTI`, `superCntSTII`, `superCntSTIII`)
  - serialize: uguale

## Rischi e note

- Alcuni dettagli (DeckAddAllCards, semantica esatta di DeckAddCardRound) sono da confermare con le specifiche del motore o esempi ufficiali.
- Ridurre le posizioni SHOWCHAR a tre valori potrebbe richiedere un piccolo refactoring UI e aggiornamento i18n.
- Rendere la regex di ShowChar case-insensitive migliora la robustezza su script legacy.

## Conclusione

La mancata copertura nel FE dei comandi Deck è la causa principale dei “non riconosciuti”. Per ShowChar, l’incoerenza tra parser (server vs FE), case-sensitivity e set di posizioni spiega il comportamento intermittente. Le azioni suggerite sopra normalizzano parser/serializer e portano a round-trip affidabile.
