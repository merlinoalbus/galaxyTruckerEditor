1)Parliamo dell'implementazione del comando SHOWCHAR ed HIDECHAR.i comandi arrivano con i seguenti JSON:
{
type: "SHOWCHAR",
parameters: {
character: "designer",
position: "left"
}
},
{
type: "HIDECHAR",
parameters: {
character: "designer"
}
}
Il blocco SHOWCHAR dovrà quindi gestire nel suo body la selezione di uno dei personaggi possibili (che non sia già in scena e con stato visible=true. può essere già in scena con stato visible=false in tal caso lo rimette visible a true). Deve avere un sistema di ricerca filtro, mostrare le anteprime delle immagini base dei vari personaggi (vedi Characters in Variables & System) e permettere all'utente di selezionare un personaggio e una posizione che può un valore a scelta tra left, right,top bottom, lefbottom, lefttop, rightbottom, righttop.
Questo blocco deve aggiornare la scena aggiungendo il personaggio alla scena.

Il blocco HIDECHAR dovrà permettere di selezionare un personaggio della scena che è in visible=true e nasconderlo (visible=false).

qualsiasi comando di modifica di un personaggio rende quel personaggio l'ultimo modificato. SAY e ASK dovranno fare riferimento sempre all'ultimo personaggio modificato.

La configurazione del sistema di valorizzazione dei parametri deve essere sempre gestita in multilingua come il resto dei blocchi. 

La visione nell'header del blocco dovrà essere ICONA(uguale alla toolbar) LABEL  nomepersonaggio  posizione <immagine no avatar> => <immaginebase_personaggio/ultimaimmaginediscena del personaggio>

puoi procedere a segnare come svolto 1 punto solo che l'agent galaxy-task-validator avrà approvato il completamento dell'attività. sei TENUTO a passare all'agent, l'intera specifica ricevuta da me la tua lista todos e l'esatto testo del task corrente che è oggetto di verifica. l'AGENT HA POTERE ASSOLUTO SU DI TE, SE DECIDE CHE NON HAI SVOLTO BENE L'ATTIVITà DEVI ESEGUIRE QUELLO CHE TI CHIEDE E POI RITESTARE. NON SEI AUTORIZZATA A FERMARTI FINO AL COMPLETAMENTO DELLA TODOS CONFERMATA IN OGNI PUNTO DALL'AGENT

 Update Todos
  ⎿  ☐ Implementare blocco SHOWCHAR con selezione personaggio e posizione      
     ☐ Implementare blocco HIDECHAR con selezione personaggio visibile
     ☐ Aggiungere icone toolbar per SHOWCHAR e HIDECHAR
     ☐ Implementare sistema di ricerca/filtro personaggi con anteprime
     ☐ Aggiornare gestione scene con SHOWCHAR/HIDECHAR
     ☐ Implementare header compatto con visualizzazione personaggio e posizione
     ☐ Gestire multilingua per tutti i parametri
     ☐ Verificare con galaxy-task-validator