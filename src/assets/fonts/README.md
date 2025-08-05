# Font Personalizzati Galaxy Trucker

## Formati richiesti

Per garantire la massima compatibilità, fornire il font nei seguenti formati:

1. **WOFF2** (.woff2) - Priorità massima, migliore compressione
2. **WOFF** (.woff) - Fallback per browser meno recenti  
3. **TTF** (.ttf) - Fallback finale

## Come convertire i font

### Da TTF/OTF a WOFF/WOFF2:

**Opzione 1 - Online:**
- https://cloudconvert.com/ttf-to-woff2
- https://convertio.co/ttf-woff2/

**Opzione 2 - Tool locali:**
```bash
# Installa woff2 tools
npm install -g ttf2woff2

# Converti
ttf2woff2 GalaxyTrucker.ttf GalaxyTrucker.woff2
```

### Da font bitmap (.fnt) del gioco:

I file .fnt sono font bitmap, non ideali per web. Opzioni:

1. **Ricreare il font** - Disegnare un font vettoriale ispirato all'originale
2. **Trovare font simili** - Cercare font sci-fi gratuiti su:
   - Google Fonts (https://fonts.google.com)
   - DaFont (https://www.dafont.com/theme.php?cat=303)
   - Font Squirrel (https://www.fontsquirrel.com/)

## Font consigliati simili a Galaxy Trucker:

### Gratuiti:
- **Orbitron** - Google Fonts, stile futuristico
- **Audiowide** - Google Fonts, tech/gaming
- **Black Ops One** - Google Fonts, militare/spaziale
- **Russo One** - Google Fonts, stile russo/spaziale

### Come usarli da Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

.galaxy-title {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
}
```

## Struttura cartella fonts:
```
src/assets/fonts/
├── GalaxyTrucker.woff2
├── GalaxyTrucker.woff
├── GalaxyTrucker.ttf
├── GalaxyTrucker-Light.woff2
├── GalaxyTrucker-Light.woff
├── GalaxyTrucker-Light.ttf
└── README.md
```