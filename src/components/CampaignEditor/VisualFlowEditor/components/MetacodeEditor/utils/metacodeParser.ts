/**
 * Metacode Parser Utilities
 * Riconosce e analizza i pattern di metacodice nel testo
 */

import { ParsedMetacode } from '../types';

/**
 * Pattern regex per ogni tipo di metacodice
 */
const PATTERNS = {
  gender: /\[g\(([^|]+)\|([^|]+)(\|([^|]+))?\)\]/g,
  verb: /\[v\(([^|]+)\|([^|]+)\)\]/g,
  number: /\[n\(((?:\d+:[^|]+\|)*\d+:[^|]+)\)\]/g,
  image: /\[img\(([^)]+)\)\](\*([a-z0-9]+))?/g,
  icon: /\[i\(([^)]+)\)\]/g,
  player: /\[p(\d*)\]/g,
  name: /\[NAME\]/g,
  missionResult: /\[missionResult\]/g,
  string: /\[s(\d*)\]/g,
  conditional: /\[b\(([^)]+)\)\]/g,
  vector: /\[vecP\(([^|]+)\|([^|]+)\)\]/g,
  numeral: /\[n(\d*)(s|e)?\]/g,
  ordinal: /\[numth(\d+)\]/g,
  simple: /\[([a-zA-Z]+)\]/g
};

/**
 * Analizza il testo e trova tutti i pattern di metacodice
 */
export function parseMetacode(text: string): ParsedMetacode[] {
  const results: ParsedMetacode[] = [];
  
  // Cerca pattern di genere
  let match;
  const genderRegex = new RegExp(PATTERNS.gender);
  while ((match = genderRegex.exec(text)) !== null) {
    results.push({
      type: 'gender',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        male: match[1],
        female: match[2],
        neutral: match[4] || null
      }
    });
  }
  
  // Cerca pattern di verbo
  const verbRegex = new RegExp(PATTERNS.verb);
  while ((match = verbRegex.exec(text)) !== null) {
    results.push({
      type: 'verb',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        mobile: match[1],
        desktop: match[2]
      }
    });
  }
  
  // Cerca pattern numerici/plurali [n(1:x|2:y)]
  const numberRegex = new RegExp(PATTERNS.number);
  while ((match = numberRegex.exec(text)) !== null) {
    const forms = match[1].split('|').map(form => {
      const [count, text] = form.split(':');
      return { count: parseInt(count), text };
    });
    results.push({
      type: 'plural', // Cambiato da 'number' a 'plural' per il pattern [n(1:...|2:...)]
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: { forms }
    });
  }
  
  // Cerca pattern di immagini
  const imageRegex = new RegExp(PATTERNS.image);
  while ((match = imageRegex.exec(text)) !== null) {
    results.push({
      type: 'image',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        path: match[1],
        multiplier: match[3] || null
      }
    });
  }
  
  // Cerca pattern di icone
  const iconRegex = new RegExp(PATTERNS.icon);
  while ((match = iconRegex.exec(text)) !== null) {
    results.push({
      type: 'icon',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        path: match[1]
      }
    });
  }
  
  // Cerca pattern NAME
  const nameRegex = new RegExp(PATTERNS.name);
  while ((match = nameRegex.exec(text)) !== null) {
    results.push({
      type: 'playerName', // Cambiato da 'name' a 'playerName' per consistenza
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {}
    });
  }
  
  // Cerca pattern missionResult
  const missionRegex = new RegExp(PATTERNS.missionResult);
  while ((match = missionRegex.exec(text)) !== null) {
    results.push({
      type: 'missionResult',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {}
    });
  }
  
  // Cerca pattern player
  const playerRegex = new RegExp(PATTERNS.player);
  while ((match = playerRegex.exec(text)) !== null) {
    results.push({
      type: 'player',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        number: match[1] || null
      }
    });
  }
  
  // Ordina per posizione
  return results.sort((a, b) => a.start - b.start);
}

/**
 * Ottimizza i pattern di genere combinando prefissi comuni
 * Esempio: [g(calcolo|calcola)] -> calcol[g(o|a)]
 */
export function optimizeGenderPattern(male: string, female: string, neutral?: string): string {
  // Se una delle stringhe è vuota, non ottimizzare
  if (!male || !female) {
    return neutral 
      ? `[g(${male}|${female}|${neutral})]`
      : `[g(${male}|${female})]`;
  }
  
  // Trova il prefisso comune
  let commonPrefix = '';
  const minLength = Math.min(male.length, female.length);
  for (let i = 0; i < minLength; i++) {
    if (male[i] === female[i]) {
      commonPrefix += male[i];
    } else {
      break;
    }
  }
  
  // Trova il suffisso comune
  let commonSuffix = '';
  for (let i = 1; i <= minLength - commonPrefix.length; i++) {
    if (male[male.length - i] === female[female.length - i]) {
      commonSuffix = male[male.length - i] + commonSuffix;
    } else {
      break;
    }
  }
  
  // Estrai le parti diverse
  const maleDiff = male.substring(commonPrefix.length, male.length - commonSuffix.length);
  const femaleDiff = female.substring(commonPrefix.length, female.length - commonSuffix.length);
  
  // Se le differenze sono brevi (1-2 caratteri), ottimizza
  if (maleDiff.length <= 2 && femaleDiff.length <= 2) {
    if (neutral) {
      const neutralDiff = neutral.substring(commonPrefix.length, neutral.length - commonSuffix.length);
      return `${commonPrefix}[g(${maleDiff}|${femaleDiff}|${neutralDiff})]${commonSuffix}`;
    }
    return `${commonPrefix}[g(${maleDiff}|${femaleDiff})]${commonSuffix}`;
  }
  
  // Altrimenti, mantieni il formato completo
  return neutral 
    ? `[g(${male}|${female}|${neutral})]`
    : `[g(${male}|${female})]`;
}

/**
 * Sostituisce un pattern nel testo con un nuovo valore
 */
export function replaceMetacode(text: string, parsed: ParsedMetacode, newCode: string): string {
  return text.substring(0, parsed.start) + newCode + text.substring(parsed.end);
}

/**
 * Inserisce un pattern nella posizione del cursore
 */
export function insertMetacodeAtCursor(
  text: string, 
  cursorPosition: number, 
  code: string
): { newText: string; newCursorPosition: number } {
  const before = text.substring(0, cursorPosition);
  const after = text.substring(cursorPosition);
  return {
    newText: before + code + after,
    newCursorPosition: cursorPosition + code.length
  };
}

/**
 * Genera il codice per un pattern di genere
 */
export function generateGenderCode(male: string, female: string, neutral?: string): string {
  return optimizeGenderPattern(male, female, neutral);
}

/**
 * Genera il codice per un pattern di verbo
 */
export function generateVerbCode(mobile: string, desktop: string): string {
  return `[v(${mobile}|${desktop})]`;
}

/**
 * Genera il codice per un pattern numerico
 */
export function generateNumberCode(forms: { count: number; text: string }[]): string {
  const formStrings = forms.map(f => `${f.count}:${f.text}`).join('|');
  return `[n(${formStrings})]`;
}

/**
 * Genera il codice per un pattern di immagine
 */
export function generateImageCode(path: string, multiplier?: string): string {
  return multiplier ? `[img(${path})]*${multiplier}` : `[img(${path})]`;
}

/**
 * Genera il codice per un pattern di icona
 */
export function generateIconCode(path: string): string {
  return `[i(${path})]`;
}

/**
 * Genera il codice per altri pattern semplici
 */
export function generateSimpleCode(type: string, data?: any): string {
  switch (type) {
    // Pattern reali senza modal
    case 'playerName':
      return '[NAME]';
    case 'missionResult':
      return '[missionResult]';
    
    // Pattern reali che richiederebbero modal ma diamo un default
    case 'gender':
      return '[g(|a)]';
    case 'plural':
      return '[n(1:|2:s)]';
    case 'verb':
      return '[v(tap|click)]';
    case 'image':
      return '[img(path/image.png)]';
    case 'icon':
      return '[i(path/icon.png)]';
    case 'player':
      return data?.number ? `[p${data.number}]` : '[p]';
    case 'string':
      return '[s]';
    case 'number':
      return '[n]';
    case 'vector':
      return '[vecP(, | and )]';
    case 'conditional':
      return '[b()]';
      
    default:
      return `[${type}]`;
  }
}