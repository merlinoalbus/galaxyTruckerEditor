1) Tutto il sistema di gestione dei metacode deve essere convertito con stringhe di interfaccia multilingua. Tutti gli hardcode testuali devono essere gestiti in ottica di localizzazione multilingua. Il punto non è da considerarsi completato se ci sono stringhe ancora harcodate nei componenti collegati alla gestione metacode. Vanno verificati tutti i componenti principali e tutti i componenti collegati. In più va verificato che tutte le stringhe abbiano un valore valido in tutte le lingue... e che non ci siano chiavi senza valori EN.
2) Parliamo dell'implementazione dei comandi SHOWDLGSCENE ed HIDEDLGSCENE. sono comandi che non prendono parametri:
{
type: "SHOWDLGSCENE",
parameters: { }
},
{
type: "HIDEDLGSCENE",
parameters: { }
}
tutti i blocchi legati a visualizzazione personaggi e dialoghi sono validi solo se preceduti dal comando SHOWDLGSCENE. (Integrare validazione dei blocchi SAY, ASK) Aggiungere validazione per i blocchi futuri: SHOWCHAR, CHANGECHAR, HIDECHAR, SAYCHAR, ASKCHAR, FOCUSCHAR)
Il blocco comando HIDEDLGSCENE è valido solo se preceduto da un SHOWDLGSCENE.
Layout dei comandi: Va passata la stessa icona del menu toolbar con le stesse configurazioni e stili degli altri blocchi comando. L'apertura del blocco deve visualizzare una breve descrizione del comando (MULTILINGUA) indicando che questi comandi mostrano/nascondono la finestra di dialogo e sono prerequisiti per qualsiasi componente dialogo.
Associato all'inserimento di uno showdlgscene va gestita la creazione di uno stato di quella scena in cui si memorizzano i personaggi coinvolti e lo stato dei personaggi alterato dalla sequenza di tutti i blocchi comando dialogo e character inseriti dopo il singolo showdlgscene. Una scena si considera chiusa al successivo HIDEDLGSCENE) In caso di showdlgscene consecutivi senza hide va gestita la creazione di una nuova scena che diventerà la scena principale fino al primo hide per poi tornare sulla scena originale fino al secondo hide.
es.
SHOWDLGSCENE
SHOWCHAR pippo right
SAY "ciao"
CHANGECHAR pippo pippo_saluta.png
SAY "che bello trovarti qui oggi!"
SHOWCHAR topolino left
SAY "ci sono anche io pippo!"
SHOWDLGSCENE
SHOWCHAR minnie right
SAY "Ci siamo anche noi!"
SHOWCHAR paperina left
SAY "Ciao!"
SHOWCHAR pippo_gulp right
HIDEDLGSCENE
HIDECHAR pippo
CHANGECHAR topolino topolino_sorride.png
SAY "Siamo proprio tutti!"
HIDEDLGSCENE

questo deve comportare la seguente: 2 Scene
Scena 1
{
	personaggi:[
		{
			nomepersonaggio: pippo
			last immagine: pippo_saluta.png
			visible: false
			posizione: right
		},
		{
			nomepersonaggio: topolino
			last immagine: topolino_sorride.png
			visible: true
			posizione: left
		}
	],
	internalScene: true
}
Scena 2
{
	personaggi:[
		{
			nomepersonaggio: minnie
			last immagine: minnie
			visible: true
			posizione: right
		},
		{
			nomepersonaggio: paperina
			last immagine: paperina
			visible: true
			posizione: left
		},
		{
			nomepersonaggio: pippo
			last immagine: pippo_gulp
			visible: true
			posizione: right
		}
	],
	internalScene: false
}

Questi stati serviranno per il rendering dei componenti di dialogo e di gestione personaggi perchè ogni say e ask dovrà mostrare sulla destra sia in versione compatta che in versione esplosa l'immagine (Adattata all'altezza del blocco collassato l'ultima immagine dell'ultimo personaggio attivo nella scena...) ogni scena dovrà essere calcolata e identificata in ogni punto di ancoraggio perchè ogni comando potrebbe modificare la scena.

3) aggiungi a SAY e ASK il riquadro come specificato al punto 2 con l'immagine dell'ultimo personaggio della scena e in caso non sia mai stato settato o mostrato un personaggio (dialogo senza immagine) visualizzi l'immagine di faultback no_avatar (vedi Variables&System Characters)

puoi procedere a segnare come svolto 1 punto solo che l'agent galaxy-task-validator avrà approvato il completamento dell'attività. sei TENUTO a passare all'agent, l'intera specifica ricevuta da me la tua lista todos e l'esatto testo del task corrente che è oggetto di verifica. l'AGENT HA POTERE ASSOLUTO SU DI TE, SE DECIDE CHE NON HAI SVOLTO BENE L'ATTIVITà DEVI ESEGUIRE QUELLO CHE TI CHIEDE E POI RITESTARE. NON SEI AUTORIZZATA A FERMARTI FINO AL COMPLETAMENTO DELLA TODOS CONFERMATA IN OGNI PUNTO DALL'AGENT

 Update Todos
  ⎿  ☐ Convertire sistema metacode in multilingua - sostituire tutti gli hardcode testuali
     ☐ Implementare blocchi SHOWDLGSCENE e HIDEDLGSCENE con icone toolbar
     ☐ Aggiungere descrizioni multilingua per SHOWDLGSCENE/HIDEDLGSCENE
     ☐ Implementare sistema di gestione stato scene per dialoghi
     ☐ Aggiungere validazione: blocchi dialogo validi solo dopo SHOWDLGSCENE
     ☐ Aggiungere validazione: HIDEDLGSCENE valido solo dopo SHOWDLGSCENE
     ☐ Aggiungere riquadro immagine personaggio a SAY e ASK
     ☐ Implementare fallback no_avatar per dialoghi senza personaggio
     ☐ Verificare task 1 con galaxy-task-validator
     ☐ Verificare task 2 con galaxy-task-validator
     ☐ Verificare task 3 con galaxy-task-validator