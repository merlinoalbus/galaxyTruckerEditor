// Parser e utilities per i metacodici del sistema multilingua

export interface ParsedMetacode {
  type: 'gender' | 'number' | 'image' | 'name';
  raw: string;
  start: number;
  end: number;
  data: GenderData | NumberData | ImageData | string | null;
  prefix?: string; // Testo prima del metacodice (es: "Giovann" in "Giovann[g(i|a)]")
  extendedRaw?: string; // Forma estesa completa (es: "Giovann[g(i|a)]")
  extendedStart?: number; // Inizio della forma estesa
}

export interface GenderData {
  male: string;
  female: string;
  neutral: string;
}

export interface NumberData {
  quantifiers: Array<{
    threshold: number;
    text: string;
  }>;
}

export interface ImageData {
  path: string;
  count: number;
  thumbnail?: string; // URL del thumbnail opzionale per visualizzazione inline
}

// Pattern regex per ogni tipo di metacodice
const PATTERNS = {
  // Genere: pelos[g(o|a)] oppure pelos[g(o|a|neutro)] oppure Giovann[g(i|a)] => Maschile: peloso/Giovanni | Femminile: pelosa/Giovanna | Neutro: pelos/pelosneutro
  // Il pattern ora cattura correttamente anche testo esteso prima del metacodice
  gender: /\[g\(([^|)]*)\|([^|)]*)(?:\|([^)]*))?\)\]/g,
  
  // Numero: supporta quantificatori multipli [n(2:prove|6:test|10:altro)] o il formato legacy [n(1:o|2:i)]
  number: /\[n\((?:\d+:[^|)]+(?:\||(?=\))))+\)\]/g,
  
  // Immagine: [img(star.png)*3] => mostra 3 stelle
  image: /\[img\(([^)]+)\)\*(\d+)\]/g,
  
  // Nome giocatore: [NAME]
  name: /\[NAME\]/g
};

/**
 * Parsa il testo e trova tutti i metacodici
 * 
 * PATTERN ESTESO:
 * Per i metacodici di genere e numero, il parser supporta il "pattern esteso" che include
 * il testo prima del metacodice dall'ultimo spazio. Ad esempio:
 * - "Giovann[g(i|a)]" viene parsato con prefix="Giovann"
 * - Durante la risoluzione, diventa "Giovanni" (maschile) o "Giovanna" (femminile)
 * - extendedStart indica l'inizio del pattern esteso per la corretta sostituzione
 * 
 * Questo permette di gestire parole che cambiano radicalmente tra maschile e femminile
 * mantenendo una sintassi compatta nel metacodice.
 */
export function parseMetacodes(text: string): ParsedMetacode[] {
  const metacodes: ParsedMetacode[] = [];
  
  // Parse gender metacodes con supporto per testo esteso
  let match;
  PATTERNS.gender.lastIndex = 0;
  while ((match = PATTERNS.gender.exec(text)) !== null) {
    // Trova il prefisso (testo dall'ultimo spazio o ] prima della [)
    let prefixStart = match.index - 1;
    let prefix = '';
    
    // Cerca indietro fino a trovare uno spazio, ], o l'inizio del testo
    while (prefixStart >= 0 && 
           text[prefixStart] !== ' ' && 
           text[prefixStart] !== '\n' && 
           text[prefixStart] !== '\t' &&
           text[prefixStart] !== ']') {
      prefixStart--;
    }
    prefixStart++; // Torna al primo carattere del prefisso
    
    if (prefixStart < match.index) {
      prefix = text.substring(prefixStart, match.index);
    }
    
    metacodes.push({
      type: 'gender',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        male: match[1] || '',
        female: match[2] || '',
        neutral: match[3] || ''
      } as GenderData,
      prefix: prefix,
      extendedRaw: prefix + match[0],
      extendedStart: prefixStart
    });
  }
  
  // Parse number metacodes con supporto per testo esteso
  PATTERNS.number.lastIndex = 0;
  while ((match = PATTERNS.number.exec(text)) !== null) {
    // Trova il prefisso (testo dall'ultimo spazio o ] prima della [)
    let prefixStart = match.index - 1;
    let prefix = '';
    
    // Cerca indietro fino a trovare uno spazio, ], o l'inizio del testo
    while (prefixStart >= 0 && 
           text[prefixStart] !== ' ' && 
           text[prefixStart] !== '\n' && 
           text[prefixStart] !== '\t' &&
           text[prefixStart] !== ']') {
      prefixStart--;
    }
    prefixStart++; // Torna al primo carattere del prefisso
    
    if (prefixStart < match.index) {
      prefix = text.substring(prefixStart, match.index);
    }
    
    // Estrai i quantificatori dal match
    const quantifiersStr = match[0].slice(3, -2); // Rimuove [n( e )]
    const quantifiers: Array<{threshold: number; text: string}> = [];
    
    // Parsa ogni quantificatore (es: "2:prove", "6:test", "10:altro")
    const parts = quantifiersStr.split('|');
    parts.forEach(part => {
      const [threshold, text] = part.split(':');
      if (threshold && text) {
        quantifiers.push({
          threshold: parseInt(threshold, 10),
          text: text
        });
      }
    });
    
    // Ordina i quantificatori per threshold crescente
    quantifiers.sort((a, b) => a.threshold - b.threshold);
    
    metacodes.push({
      type: 'number',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: { quantifiers } as NumberData,
      prefix: prefix,
      extendedRaw: prefix + match[0],
      extendedStart: prefixStart
    });
  }
  
  // Parse image metacodes
  PATTERNS.image.lastIndex = 0;
  while ((match = PATTERNS.image.exec(text)) !== null) {
    metacodes.push({
      type: 'image',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: {
        path: match[1],
        count: parseInt(match[2], 10)
      } as ImageData
    });
  }
  
  // Parse name metacodes
  PATTERNS.name.lastIndex = 0;
  while ((match = PATTERNS.name.exec(text)) !== null) {
    metacodes.push({
      type: 'name',
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      data: null
    });
  }
  
  // Ordina per posizione nel testo
  return metacodes.sort((a, b) => a.start - b.start);
}

/**
 * Sostituisce un metacodice nel testo con il valore appropriato
 * Gestisce anche i metacodici estesi (es: Giovann[g(i|a)] => Giovanni/Giovanna)
 */
export function resolveMetacode(
  metacode: ParsedMetacode,
  genderState: 'male' | 'female' | 'disabled',
  numberState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 20 | 30 | 40 | 50 | 100 | 'more' | 'disabled',
  playerName: string = 'Player',
  numberValue?: number
): string {
  switch (metacode.type) {
    case 'gender':
      const genderData = metacode.data as GenderData;
      if (genderState === 'disabled') {
        // Mostra il metacodice esteso completo
        return metacode.extendedRaw || metacode.raw;
      }
      // Costruisci la forma risolta con il prefisso
      const prefix = metacode.prefix || '';
      if (genderState === 'male') {
        return prefix + genderData.male;
      }
      if (genderState === 'female') {
        return prefix + genderData.female;
      }
      return prefix + (genderData.neutral || '');
      
    case 'number':
      const numberData = metacode.data as NumberData;
      if (numberState === 'disabled') {
        // Mostra il metacodice esteso completo
        return metacode.extendedRaw || metacode.raw;
      }
      
      // Costruisci la forma risolta con il prefisso
      const numPrefix = metacode.prefix || '';
      
      // Determina il valore numerico da usare
      let actualNumber: number;
      if (typeof numberState === 'number') {
        actualNumber = numberState;
      } else if (numberState === 'more') {
        actualNumber = 101; // Usa 101 per "100+"
      } else {
        // Se numberValue è fornito, usalo, altrimenti usa 2 come default
        actualNumber = numberValue !== undefined ? numberValue : 2;
      }
      
      // Trova il quantificatore appropriato in base al valore
      let selectedText = '';
      
      // Se abbiamo quantificatori multipli (nuovo formato)
      if (numberData.quantifiers && numberData.quantifiers.length > 0) {
        // Trova il quantificatore con la threshold più alta che è <= actualNumber
        for (let i = numberData.quantifiers.length - 1; i >= 0; i--) {
          if (actualNumber >= numberData.quantifiers[i].threshold) {
            selectedText = numberData.quantifiers[i].text;
            break;
          }
        }
        // Se nessun quantificatore corrisponde, usa il primo (threshold più bassa)
        if (!selectedText && numberData.quantifiers.length > 0) {
          selectedText = numberData.quantifiers[0].text;
        }
      }
      
      return numPrefix + selectedText;
      
    case 'image':
      const imageData = metacode.data as ImageData;
      // Estrai solo il nome del file senza path (gestisce sia / che \)
      const pathParts = imageData.path.split(/[/\\]/);
      const fullFileName = pathParts[pathParts.length - 1] || imageData.path;
      // Rimuove l'estensione
      const fileNameWithoutExt = fullFileName.replace(/\.[^/.]+$/, '');
      // Mostra il moltiplicatore solo se > 1
      return imageData.count > 1 ? `${fileNameWithoutExt}*${imageData.count}` : fileNameWithoutExt;
      
    case 'name':
      // Mostra sempre come [NAME] nella textbox
      return '[NAME]';
      
    default:
      return metacode.raw;
  }
}

/**
 * Processa il testo completo sostituendo tutti i metacodici in base agli stati
 */
export function processText(
  text: string,
  genderState: 'male' | 'female' | 'disabled',
  numberState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 20 | 30 | 40 | 50 | 100 | 'more' | 'disabled',
  playerName: string = 'Player',
  numberValue?: number
): string {
  const metacodes = parseMetacodes(text);
  
  if (metacodes.length === 0) {
    return text;
  }
  
  let processedText = '';
  let lastEnd = 0;
  
  for (const metacode of metacodes) {
    // Per pattern estesi, usa extendedStart invece di start per evitare duplicazione del prefisso
    const actualStart = metacode.extendedStart !== undefined ? metacode.extendedStart : metacode.start;
    
    // Aggiungi il testo prima del metacodice (usando actualStart per pattern estesi)
    processedText += text.substring(lastEnd, actualStart);
    
    // Risolvi e aggiungi il metacodice
    processedText += resolveMetacode(metacode, genderState, numberState, playerName, numberValue);
    
    lastEnd = metacode.end;
  }
  
  // Aggiungi il testo rimanente
  processedText += text.substring(lastEnd);
  
  return processedText;
}

/**
 * Genera il codice metacodice per genere
 */
export function generateGenderCode(male: string, female: string, neutral: string): string {
  return `[g(${male}|${female}|${neutral})]`;
}

/**
 * Genera il codice metacodice esteso per genere con ottimizzazione
 * Es: "Professore", "Professoressa", "" => "Professore[g(|ssa)]"
 */
export function generateExtendedGenderCode(male: string, female: string, neutral?: string): string {
  if (!male && !female && !neutral) return '';
  
  // Trova il prefisso comune più lungo
  let commonPrefix = '';
  const hasNeutral = neutral !== undefined && neutral !== null;
  
  // Calcola la lunghezza minima considerando solo le stringhe non vuote
  const lengths = [male.length, female.length];
  if (hasNeutral && neutral) {
    lengths.push(neutral.length);
  }
  const minLength = Math.min(...lengths.filter(l => l > 0));
  
  for (let i = 0; i < minLength; i++) {
    const maleChar = male[i] || '';
    const femaleChar = female[i] || '';
    
    // Se neutral è presente, confronta anche con esso
    if (hasNeutral && neutral) {
      const neutralChar = neutral[i] || '';
      if (maleChar === femaleChar && maleChar === neutralChar) {
        commonPrefix += maleChar;
      } else {
        break;
      }
    } else {
      // Solo confronto male/female
      if (maleChar === femaleChar) {
        commonPrefix += maleChar;
      } else {
        break;
      }
    }
  }
  
  // Estrai le parti variabili
  const maleSuffix = male.substring(commonPrefix.length);
  const femaleSuffix = female.substring(commonPrefix.length);
  const neutralSuffix = neutral ? neutral.substring(commonPrefix.length) : '';
  
  // Genera il metacodice ottimizzato
  if (neutral) {
    return `${commonPrefix}[g(${maleSuffix}|${femaleSuffix}|${neutralSuffix})]`;
  } else {
    return `${commonPrefix}[g(${maleSuffix}|${femaleSuffix})]`;
  }
}

/**
 * Genera il codice metacodice per numero
 */
export function generateNumberCode(quantifiers: Array<{threshold: number; text: string}>): string {
  if (!quantifiers || quantifiers.length === 0) return '';
  
  // Ordina per threshold crescente
  const sorted = [...quantifiers].sort((a, b) => a.threshold - b.threshold);
  
  // Costruisci il codice
  const parts = sorted.map(q => `${q.threshold}:${q.text}`);
  return `[n(${parts.join('|')})]`;
}

/**
 * Genera il codice metacodice esteso per numero con ottimizzazione
 * Es: [{threshold: 1, text: "amico"}, {threshold: 2, text: "amici"}] => "amic[n(1:o|2:i)]"
 */
export function generateExtendedNumberCode(quantifiers: Array<{threshold: number; text: string}>): string {
  if (!quantifiers || quantifiers.length === 0) return '';
  
  // Ordina per threshold crescente
  const sorted = [...quantifiers].sort((a, b) => a.threshold - b.threshold);
  
  // Trova il prefisso comune più lungo tra tutti i testi
  let commonPrefix = '';
  if (sorted.length > 0) {
    const firstText = sorted[0].text;
    
    for (let i = 0; i < firstText.length; i++) {
      const char = firstText[i];
      let allMatch = true;
      
      for (let j = 1; j < sorted.length; j++) {
        if (!sorted[j].text || sorted[j].text[i] !== char) {
          allMatch = false;
          break;
        }
      }
      
      if (allMatch) {
        commonPrefix += char;
      } else {
        break;
      }
    }
  }
  
  // Estrai le parti variabili (suffissi dopo il prefisso comune)
  const parts = sorted.map(q => {
    const suffix = q.text.substring(commonPrefix.length);
    return `${q.threshold}:${suffix}`;
  });
  
  // Genera il metacodice ottimizzato
  return `${commonPrefix}[n(${parts.join('|')})]`;
}

/**
 * Genera il codice metacodice per immagine
 */
export function generateImageCode(path: string, count: number): string {
  return `[img(${path})*${count}]`;
}

/**
 * Estrae il testo base rimuovendo la parte del metacodice specificato
 * Es: "pelos[g(o|a|)]" => "pelos"
 */
export function extractBaseText(text: string, metacodeStart: number): string {
  return text.substring(0, metacodeStart);
}

/**
 * Trova il contesto intorno a un metacodice (parola prima del metacodice)
 * Es: "pelos[g(o|a|)]" => "pelos"
 * Es: "Giovann[g(i|a)]" => "Giovann"
 */
export function getMetacodeContext(text: string, metacode: ParsedMetacode): string {
  // Trova l'inizio della parola prima del metacodice
  // Includiamo lettere, numeri e caratteri Unicode per supportare nomi completi
  let wordStart = metacode.start - 1;
  while (wordStart >= 0 && /[\w\u00C0-\u024F\u1E00-\u1EFF]/.test(text[wordStart])) {
    wordStart--;
  }
  wordStart++;
  
  return text.substring(wordStart, metacode.start);
}