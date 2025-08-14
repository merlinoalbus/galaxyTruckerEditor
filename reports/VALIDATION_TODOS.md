ERRORI:
1)Compiled with problems:
×
ERROR in ./src/components/CampaignEditor/VisualFlowEditor/VisualFlowEditor.tsx 803:37-49
export 'MissionsList' (imported as 'MissionsList') was not found in './components/MissionsList' (module has no exports)
ERROR in ./src/components/CampaignEditor/VisualFlowEditor/VisualFlowEditor.tsx 910:37-52
export 'NewScriptDialog' (imported as 'NewScriptDialog') was not found in './components/NewScriptDialog' (module has no exports)

2)quando provo a trascinare un blocco dopo un altro blocco il blocco che ho trascinato viene inserito non nel punto corretto (l'ancora dove l'ho rilasciato) ma in corrispondenza dell'ancora successiva (un blocco più giù rispetto a dove doveva essere)... es. SAY1 ASK SAY2 Se provo a trascinare SAY1 dopo ASK => ASK SAY2 SAY1 se invece sposto il successivo blocco ad ASK prima di ASK funziona correttamente. SAY1 ASK SAY2 ==> SAY1 SAY2 ASK. Questa situazione si verifica con qualsiasi blocco.
3) la validazione di SUB_SCRIPT non valida il parametro corretto... pur essendo il blocco correttamente valorizzato la validazione identifica parametro vuoto.
4) Il font delle label dei blocchi... vorrei fosse il font dei titoli, così come il titolo Visual FLow Editor e Tools (stesso font ma dimensione conforme all'attuale)


puoi procedere a segnare come svolto 1 punto solo che l'agent galaxy-task-validator avrà approvato il completamento dell'attività. sei TENUTO a passare all'agent, l'intera specifica ricevuta da me la tua lista todos e l'esatto testo del task corrente che è oggetto di verifica. l'AGENT HA POTERE ASSOLUTO SU DI TE, SE DECIDE CHE NON HAI SVOLTO BENE L'ATTIVITà DEVI ESEGUIRE QUELLO CHE TI CHIEDE E POI RITESTARE. NON SEI AUTORIZZATA A FERMARTI FINO AL COMPLETAMENTO DELLA TODOS CONFERMATA IN OGNI PUNTO DALL'AGENT

 Update Todos
  ⎿  ☐ Fix MissionsList export error in VisualFlowEditor    
     ☐ Fix NewScriptDialog export error in VisualFlowEditor
     ☐ Fix drag-and-drop insertion position bug (off by one)
     ☐ Fix SUB_SCRIPT validation parameter issue
     ☐ Update font styles for block labels and titles
