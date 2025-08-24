# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

Full Visual Editor for Galaxy Trucker with real-time management of scripts, missions, and game systems.

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Context API, Monaco Editor
- **Backend**: Express.js, Node.js, real-time YAML/TXT file management  
- **Build**: Craco (CRA wrapper), custom path aliases with `@/`

### Core Architecture Patterns

**Hooks Composition Pattern**: All business logic encapsulated in modular hooks
- `useBlockManipulation`: Block CRUD operations with validation
- `useDragAndDrop`: Drag-drop state and handlers
- `useZoomNavigation`: Viewport and zoom controls
- `useScriptManagement`: Script loading/saving/parsing
- `useJsonConversion`: Bidirectional JSON↔Block conversion

**Service Layer Pattern**: Parser services handle complex transformations
- `CampaignScriptParserService`: Main parser orchestrator
- `scriptParserService`: Nested block parsing (1222 lines)
- `scriptLoaderService`: File I/O operations
- Preserves formatting, comments, empty lines

**Context Providers**: Global state management
- `SceneContext`: Dialog scene state management
- `LanguageContext`: Multi-language support
- `FullscreenContext`: Fullscreen mode control
- `AchievementsImagesContext`: Achievement images caching

### Modular Structure

```
src/
├── components/CampaignEditor/
│   ├── VisualFlowEditor/      # Drag-and-drop script block editor
│   ├── InteractiveMap/         # Interactive mission graph
│   ├── VariablesSystem/        # Variables/achievements management
│   └── Overview/               # Quality metrics dashboard
├── hooks/                      # Custom React hooks (use* pattern)
├── services/                   # Parsers and business logic
├── types/                      # TypeScript definitions (I* prefix for interfaces)
└── contexts/                   # Global context providers

server/
├── GAMEFOLDER/                # Real game files (CAUTION: direct modifications)
│   ├── campaignScripts*/      # Scripts per language (EN/DE/FR/ES/PL/CS/RU)
│   ├── missions/              # YAML missions
│   └── localization_strings/  # Translations
└── server.js                  # Express entry point (port 3001)
```

## Development Commands

### Server Management

```bash
# Backend (port 3001) - NO hot reload, requires manual restart
startBE      # Start Backend with verification (scripts/start-be.sh)
stopBE       # Stop Backend (scripts/stop-be.sh)
restartBE    # Restart Backend (scripts/restart-be.sh)

# Frontend (port 3000) - Auto hot reload
startFE      # Start Frontend with verification (scripts/start-fe.sh)
stopFE       # Stop Frontend (scripts/stop-fe.sh)
restartFE    # Restart Frontend (scripts/restart-fe.sh)

# Combined management
start        # Start both sequentially (scripts/start-all.sh)
stop         # Stop both (scripts/stop-all.sh)
restart      # Restart both (scripts/restart-all.sh)
```

**CRITICAL**: 
- Backend requires `restartBE` after any `server/` modifications
- Logs saved to `BE.log` (backend) and `FE.log` (frontend) in project root
- All scripts verify service startup with 60-second timeout

### Build & Test

```bash
npm run build        # Production build with Craco
npm test            # Jest tests with React Testing Library

# Backend specific
cd server && npm run dev    # Development mode with nodemon (auto-restart)
cd server && npm test       # Backend Jest tests
```

## Visual Flow Editor - Block System

### Supported Block Types

Core blocks defined in `types/CampaignEditor/VisualFlowEditor/blocks.types.ts`:
- **Basic**: TEXT, SAY, GO, EXIT_MENU, LAUNCH_MISSION
- **Containers**: MENU (with OPT children), IF (with THEN/ELSE)
- **Scenes**: SHOW_SCENE, HIDE_SCENE, SHOWDLGSCENE, HIDEDLGSCENE
- **Characters**: SHOW_CHAR, HIDE_CHAR, CHANGECHAR, SAYCHAR
- **Construction**: BUILD, FLIGHT (with init/start/evaluate sub-blocks)

### Adding New Block

1. **Define type** in `blocks.types.ts`
2. **Create component** in `components/.../blocks/NewBlock/`
3. **Register renderer** in `BlockRenderer.tsx`
4. **Add color** in `utils/.../blockColors.ts`
5. **Implement validation** in `hooks/.../validation/`
6. **Extend parser** in `CampaignScriptParserService.ts`

## Bidirectional Parsing System

Key services:
- **CampaignScriptParserService**: Main campaign script parser
- **scriptParserService**: Nested blocks and metacode parsing
- Preserves: comments, empty lines, original formatting

## Multilingua & Metacodes

### Supported Languages
EN, DE, FR, ES, PL, CS, RU

### Main Metacodes (50+ patterns)
- Variables: `[player]`, `[credits]`, `[flight]`, `[ship]`
- Results: `[mission_result:ID]`, `[string:KEY]`
- Conditional: `[gender:M|F|N:text]`, `[plural:N|S:text]`
- Images: `[image:character:NAME]`

Structural changes auto-propagate across languages preserving existing translations.

## Backend API

Base URL: `http://localhost:3001/api` (configured in `src/config/constants.ts`)

```javascript
// Scripts endpoints
/api/scripts                          # GET all scripts, POST new script
/api/scripts/:name                    # GET script by name
/api/scripts/:name/save              # POST save script
/api/scripts/variables               # GET all variables
/api/scripts/semaphores              # GET all semaphores
/api/scripts/labels                  # GET all labels

// Translations
/api/scripts/translations/coverage    # GET translation coverage stats
/api/scripts/translations/:name      # GET translation details for script
/api/scripts/ai-translate            # POST AI translation request
/api/scripts/ai-translate-batch      # POST batch AI translation

// Missions
/api/missions                        # GET all missions
/api/missions/:name                  # GET mission by name
/api/missions/:name/save            # POST save mission
/api/missions/routes                 # GET mission routes

// Game elements
/api/game/characters                 # GET character definitions
/api/game/nodes                     # GET map nodes
/api/game/achievements              # GET achievements
/api/images                         # GET character images
/api/images/binary                  # GET binary image data
```

All endpoints validate with `jsonschema` and sanitize paths.

## Code Conventions

### TypeScript
- Types in dedicated `.types.ts` files
- Interfaces with `I` prefix
- Discriminated unions for variants
- Strict mode enabled
- Path alias `@/` maps to `src/`

### React
- Functional components + hooks
- Custom hooks with `use` prefix
- React.memo for optimization
- Context API for global state

### Styling
- Tailwind CSS utilities-first
- Custom `gt-*` theme for Galaxy Trucker
- Native CSS animations

## Validation & Testing

### Automatic Validation
- Command syntax and nested structure
- Referenced file existence (missions, images)
- Multilingua metacode consistency
- Localization character limits

### Pre-Commit Checklist
1. `npm run build` without errors
2. `restartBE` starts correctly
3. Clean editor validation
4. Drag-and-drop preserves structure
5. Round-trip parsing maintains content

## Critical Notes

- **Real Files**: Backend modifies `server/GAMEFOLDER/` directly - BACKUP REQUIRED
- **Performance**: Virtualize scripts >2000 lines for optimal rendering
- **Parser**: Never modify comment preservation logic - critical for game compatibility
- **Multilingua**: Always sync structure across all 7 languages when modifying scripts
- **Hot Reload**: Frontend only, Backend requires manual `restartBE` after changes
- **Browser**: Chrome/Edge optimal, Firefox may have drag-and-drop issues
- **Block IDs**: Generated with UUID v4, must be unique across entire script tree
- **Validation**: Two-tier system - errors (blocking) and warnings (non-blocking)
- **Script Parsing**: Bidirectional conversion must be lossless (script→blocks→script)

## Known Issues & Workarounds

- **Large Scripts**: Scripts over 2000 lines may cause performance issues - use virtualization
- **Drag-Drop Firefox**: Use Chrome/Edge for reliable drag-and-drop operations
- **Backend Restart**: Always restart backend after modifying server files - no hot reload
- **Translation Sync**: Structural changes require manual sync across all language files