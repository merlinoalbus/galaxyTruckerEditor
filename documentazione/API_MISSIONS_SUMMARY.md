# Riepilogo API Missions

## Endpoints Implementati

### 1. GET /api/missions
Lista tutte le missions disponibili con metadati completi

### 2. GET /api/missions/:missionName
Carica una mission specifica con parsing a blocchi

Query parameters:
- `multilingua=true` - Carica tutte le lingue
- `format=blocks` - Ritorna struttura a blocchi parsata
- `lang=EN` - Lingua specifica (default EN)

Esempio: `/api/missions/roughMission?multilingua=true&format=blocks`

### 3. POST /api/missions/saveMission
Salva una mission da struttura JSON

Body: Array con oggetto mission:
```json
[{
  "name": "missionName",
  "fileName": "file.txt",
  "blocksMission": [...],
  "blocksFinish": [...]
}]
```

### 4. GET /api/missions/routes
Lista tutti gli archi/rotte della mappa

## Struttura JSON Mission

```json
{
  "name": "roughMission",
  "fileName": "missions.txt",
  "originalCode": "...",
  "blocksMission": [
    // Comandi prima di FINISH_MISSION
    {
      "type": "BUILD",
      "blockInit": [],
      "blockStart": [],
      "numBlockInit": 0,
      "numBlockStart": 0
    },
    {
      "type": "FLIGHT",
      "blockInit": [],
      "blockStart": [],
      "blockEvaluate": [],
      "numBlockInit": 0,
      "numBlockStart": 0,
      "numBlockEvaluate": 0
    }
  ],
  "blocksFinish": [
    // Comandi dopo FINISH_MISSION
  ]
}
```

## Note Implementative

1. **Parser Aggiornato**: Il parser supporta ora i comandi mission con case-insensitive e virgolette opzionali
2. **Struttura BUILD/FLIGHT**: I blocchi BUILD e FLIGHT sono aggregati con le loro fasi
3. **Compatibilità Scripts**: Le modifiche al parser sono trasparenti per gli scripts esistenti
4. **Multilingua**: Supporto completo per tutte le 7 lingue (EN, CS, DE, ES, FR, PL, RU)

## Comandi Mission Supportati

- ADDOPPONENT
- SETDECKPREPARATIONSCRIPT  
- SETSPECCONDITION
- MODIFYOPPONENTSBUILDSPEED
- SETSHIPTYPE
- BUILDINGHELPSCRIPT
- FLIGHTHELPSCRIPT
- ADDMISSIONCREDITS (supporta valori negativi)
- ADDOPPONENTSCREDITS (supporta valori negativi)
- SETMISSIONASFAILED
- SETMISSIONASCOMPLETED
- Tutti i comandi IF specifici per missions (IFMISSIONRESULTIS, IFMISSIONRESULTMIN, IF_MISSION_WON)

## Testing

Per testare le API:

```bash
# Lista missions
curl http://localhost:3001/api/missions

# Carica mission specifica
curl "http://localhost:3001/api/missions/roughMission?multilingua=true&format=blocks"

# Salva mission
curl -X POST http://localhost:3001/api/missions/saveMission \
  -H "Content-Type: application/json" \
  -d '[{"name":"testMission","fileName":"test.txt","blocksMission":[],"blocksFinish":[]}]'
```