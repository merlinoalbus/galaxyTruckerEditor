// scriptAnalyzer.js - Utility per analisi ricorsiva degli script
const { getLogger } = require('./logger');
const logger = getLogger();

/**
 * Trova tutti gli script collegati a un nodo o rotta in modo ricorsivo
 * @param {String} entityName - Nome del nodo o identificativo della rotta (es. "bar" o "bar-regula")
 * @param {Array} allScripts - Array di tutti gli script disponibili dal sistema
 * @param {String} entityType - Tipo di entità: 'node' o 'route'
 * @returns {Array} Array di nomi di script collegati (include ricorsivamente tutti gli script richiamati)
 */
function findAllRelatedScripts(entityName, allScripts, entityType = 'node') {
  const relatedScripts = new Set();
  const processedScripts = new Set();
  
  // Prima passa: trova script direttamente collegati all'entità
  const directScripts = new Set();
  
  for (const script of allScripts) {
    let isDirectlyRelated = false;
    
    if (entityType === 'node') {
      // Per i nodi, controlla nodi_referenziati
      if (script.nodi_referenziati && script.nodi_referenziati.includes(entityName)) {
        isDirectlyRelated = true;
      }
    } else if (entityType === 'route') {
      // Per le rotte, controlla se lo script referenzia entrambi i nodi della rotta
      const [fromNode, toNode] = entityName.split('-');
      if (script.nodi_referenziati && 
          script.nodi_referenziati.includes(fromNode) && 
          script.nodi_referenziati.includes(toNode)) {
        isDirectlyRelated = true;
      }
    }
    
    if (isDirectlyRelated) {
      directScripts.add(script.nomescript);
    }
  }
  
  // Seconda passa: espansione ricorsiva
  function expandScripts(scriptName) {
    if (processedScripts.has(scriptName)) {
      return;
    }
    
    processedScripts.add(scriptName);
    relatedScripts.add(scriptName);
    
    // Trova lo script nell'array
    const script = allScripts.find(s => s.nomescript === scriptName);
    if (!script) {
      return;
    }
    
    // Aggiungi script richiamati
    if (script.script_richiamati && Array.isArray(script.script_richiamati)) {
      for (const chiamato of script.script_richiamati) {
        expandScripts(chiamato);
      }
    }
    
    // Aggiungi script che richiamano questo
    if (script.richiamato_da_script && Array.isArray(script.richiamato_da_script)) {
      for (const chiamante of script.richiamato_da_script) {
        expandScripts(chiamante);
      }
    }
  }
  
  // Espandi tutti gli script diretti
  for (const scriptName of directScripts) {
    expandScripts(scriptName);
  }
  
  return Array.from(relatedScripts);
}

/**
 * Trova tutti gli script collegati a una missione
 * @param {String} missionName - Nome della missione
 * @param {Array} allScripts - Array di tutti gli script disponibili
 * @returns {Array} Array di nomi di script collegati
 */
function findScriptsForMission(missionName, allScripts) {
  const relatedScripts = new Set();
  const processedScripts = new Set();
  
  // Prima passa: trova script che richiamano la missione
  const directScripts = new Set();
  
  for (const script of allScripts) {
    if (script.missions_richiamate && script.missions_richiamate.includes(missionName)) {
      directScripts.add(script.nomescript);
    }
  }
  
  // Seconda passa: espansione ricorsiva (stessa logica di sopra)
  function expandScripts(scriptName) {
    if (processedScripts.has(scriptName)) {
      return;
    }
    
    processedScripts.add(scriptName);
    relatedScripts.add(scriptName);
    
    const script = allScripts.find(s => s.nomescript === scriptName);
    if (!script) {
      return;
    }
    
    if (script.script_richiamati && Array.isArray(script.script_richiamati)) {
      for (const chiamato of script.script_richiamati) {
        expandScripts(chiamato);
      }
    }
    
    if (script.richiamato_da_script && Array.isArray(script.richiamato_da_script)) {
      for (const chiamante of script.richiamato_da_script) {
        expandScripts(chiamante);
      }
    }
  }
  
  for (const scriptName of directScripts) {
    expandScripts(scriptName);
  }
  
  return Array.from(relatedScripts);
}

module.exports = {
  findAllRelatedScripts,
  findScriptsForMission
};