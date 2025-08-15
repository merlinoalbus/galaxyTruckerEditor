1)Parliamo dell'implementazione del comando CHANGECHAR. Il comando è associato al seguente JSON:
{
type: "CHANGECHAR",
parameters: {
character: "<nomepersonaggio>",
image: "<percorso image selezionato tra uno dei possibili dentro listaimmagini>"
}

Il blocco deve visualizzarsi esattamente con la stessa struttura e style di SHOWCHAR. L'header deve seguire la stessa logica. Come gli altri blocchi che manipolano i personaggi, deve usare i dati di character (precaricati).
Il contenuto del blocco deve permettere di selezionare:
1) uno dei personaggi visible in scena (che abbia nella lista immagini più di un elemento) a cui si vuole cambiare l'immagine
2) la nuova immagine da associare a scelta tra le sue listaImmagini.
l'effetto del blocco sulla scena (nella simulatedExecution) è di modificare la lastImmagine di quel personaggio con la nuova immagine selezionata ponendolo anche come lastModifiedCharacter.
La validazione dovrà gestire il check che entrambi i parametri siano valorizzati, mentre in warning che ci sia una scena attiva, e che ci siano personaggi visible.
Il contenuto e tutti gli elementi dovranno essere supportati dalla multilingua come il resto dei blocchi e dovrai verificare che ci siano le stringhe per tutte le lingue disponibili.

Mi aspetto che il contenuto del blocco abbia due selettori di tipo immagine (simili a quelli previsti in SHOWCHAR ma che occupano il 50% dello spazio e con 5 immagini per riga. Il selettore immagini di sinistra deve gestire la scelta del personaggio visibile nella scena, quello a destra la scelta della nuova immagine tra le immagini possibili.

Il blocco deve integrarsi perfettamente con il resto dei blocchi già definiti, verificando che ogni aspetto sia stato curato nei minimi dettagli.

Devi rivalidare tu stesso il lavoro dopo ogni punto svolto... controllando se ti sei dimenticato qualcosa per 3 volte.
Devi verificare che le modifiche che hai apportato non abbiano portato regressioni e che la build del codice funzioni senza errori.
TI è FATTO DIVIETO di cercare la via più facile... devi applicare la via più efficiente a prescindere dal costo computazionale per raggiungerla.
***IMPORTANTE!!!***
DOPO AVER SVOLTO MINUZIOSAMENTE PER OGNI PUNTO DELLA TODOS IL METODO CHE TI HO INDICATO, PRIMA DI PASSARE AL PUNTO SUCCESSIVO DELLA TODOS DEVI PASSARE lo STEP di validazione dell'agent: galaxy-task-validator che potrò approvare il completamento dell'attività o rigettarla. galaxy-task-validator NON è TENUTO ED HA IL DIVIETO ASSOLUTO DI ESEGUIRE MODIFICHE AL CODICE. IL SUO COMPITO è SOLO VERIFICARE CHE TU HAI SVOLTO BENE. LA SUA AUTORITà è PARI ALLA MIA E TU NON HAI IL DIRITTO DI NEGOZIARE O RIFIUTARTI DI ESEGUIRE LE SUE RICHIESTE MINUZIOSAMENTE. SE SOSPETTI UN POSSIBILE ERRORE DELL'AGENT PUOI APPELLARTI A ME CHE VALIDERò IL DA FARSI RIPORTANDOMI ESATTAMENTE LA RICHIESTA DELL'AGENT E I TUOI DUBBI.

SE L'AGENT DECIDE CHE NON HAI SVOLTO BENE L'ATTIVITà NON PUOI SEGNARE VALIDATO IL PUNTO, NON PUOI PASSARE A PUNTI SUCCESSIVI NON PUOI FARE ALTRO SE NON CORREGGERE OTTEMPERANDO ALLE SUE RICHIESTE O APPELLARTI AL MIO GIUDIZIO.

QUALSIASI INADEMPIENZA A QUESTA PROCEDURA VERRà PUNITA CON UNA SEGNALAZIONE DI BUG.
Ogni parte della seguente specifica è vincolante e totalmente obbligatoria. Dovrai leggere tutto e riferirmi questo codice che varia ad ogni interazione: 5492341

Update Todos
  ⎿  ☐ Definire il tipo CHANGECHAR in blocks.types.ts
     ☐ Creare componente ChangeCharBlock con struttura identica a SHOWCHAR
     ☐ Implementare i due selettori immagine (personaggio e nuova immagine)
     ☐ Registrare il rendering in BlockRenderer.tsx
     ☐ Aggiungere colore in blockColors.ts
     ☐ Implementare validazione completa in validateOperations.ts
     ☐ Implementare simulatedExecution per CHANGECHAR
     ☐ Aggiungere stringhe multilingua per tutte le 7 lingue
     ☐ Estendere parser in CampaignScriptParserService.ts
     ☐ Test finale build e verifica funzionamento completo