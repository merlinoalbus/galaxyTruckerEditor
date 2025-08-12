/**
 * Visual Flow Editor translations for Czech
 */

export const visualFlowEditorTranslations = {
  // Main Editor
  'visualFlowEditor.title': 'Visual Flow Editor',
  'visualFlowEditor.subtitle': 'Kompletní vizuální editor se všemi 14 typy IF',
  'visualFlowEditor.loading': 'Načítání Visual Flow Editor...',
  'visualFlowEditor.noScriptLoaded': 'Žádný skript není načten',
  
  // Toolbar
  'visualFlowEditor.toolbar.scripts': 'Skripty',
  'visualFlowEditor.toolbar.missions': 'Mise',
  'visualFlowEditor.toolbar.new': 'Nový',
  'visualFlowEditor.toolbar.json': 'JSON',
  'visualFlowEditor.toolbar.save': 'Uložit',
  'visualFlowEditor.toolbar.saving': 'Ukládání...',
  'visualFlowEditor.toolbar.scriptManagement': 'Správa skriptů',
  'visualFlowEditor.toolbar.missionManagement': 'Správa misí',
  'visualFlowEditor.toolbar.newScript': 'Nový skript',
  'visualFlowEditor.toolbar.viewJson': 'Zobrazit JSON',
  'visualFlowEditor.toolbar.saveScript': 'Uložit skript',
  'visualFlowEditor.toolbar.clickToSeeErrors': 'Klikněte pro zobrazení detailů chyb',
  'visualFlowEditor.toolbar.error': 'chyba',
  'visualFlowEditor.toolbar.errors': 'chyb',
  'visualFlowEditor.toolbar.fixErrorsBeforeSaving': 'Opravte {count} chyb před uložením',
  
  // New Script Dialog
  'visualFlowEditor.newScriptDialog.title': 'Nový prvek',
  'visualFlowEditor.newScriptDialog.elementType': 'Typ prvku',
  'visualFlowEditor.newScriptDialog.script': 'Skript',
  'visualFlowEditor.newScriptDialog.mission': 'Mise',
  'visualFlowEditor.newScriptDialog.fileName': 'Název souboru',
  'visualFlowEditor.newScriptDialog.scriptPlaceholder': 'např. myScript.txt',
  'visualFlowEditor.newScriptDialog.missionPlaceholder': 'např. myMission.txt',
  'visualFlowEditor.newScriptDialog.cancel': 'Zrušit',
  'visualFlowEditor.newScriptDialog.create': 'Vytvořit',
  'visualFlowEditor.newScriptDialog.createScript': 'Vytvořit skript',
  'visualFlowEditor.newScriptDialog.createMission': 'Vytvořit misi',
  
  // Scripts List
  'visualFlowEditor.scriptsList.noScriptsAvailable': 'Žádné skripty nejsou k dispozici',
  
  // Missions List
  'visualFlowEditor.missionsList.loadingMissions': 'Načítání misí...',
  
  // Validation Errors Modal
  'visualFlowEditor.validation.title': 'Chyby validace',
  'visualFlowEditor.validation.close': 'Zavřít',
  'visualFlowEditor.validation.occurrence': 'výskyt',
  'visualFlowEditor.validation.occurrences': 'výskytů',
  'visualFlowEditor.validation.block': 'Blok',
  'visualFlowEditor.validation.path': 'Cesta',
  'visualFlowEditor.validation.goToBlock': 'Přejít →',
  'visualFlowEditor.validation.goToBlockTitle': 'Přejít na blok',
  'visualFlowEditor.validation.footer': 'Opravte tyto chyby pro zajištění správného fungování skriptu. Bloky s chybami jsou v editoru zvýrazněny červeně.',
  
  // Validation Error Messages
  'visualFlowEditor.validation.error': 'Chyba validace',
  'visualFlowEditor.validation.askAfterMenu': 'Blok ASK nemůže následovat přímo po bloku MENU',
  'visualFlowEditor.validation.menuAfterAsk': 'Blok MENU nemůže následovat přímo po bloku ASK',
  'visualFlowEditor.validation.consecutiveAsk': 'Dva po sobě jdoucí bloky ASK nejsou povoleny',
  'visualFlowEditor.validation.buildInsideContainer': 'Blok BUILD nemůže být vnořen v jiném kontejnerovém bloku',
  'visualFlowEditor.validation.flightInsideContainer': 'Blok FLIGHT nemůže být vnořen v jiném kontejnerovém bloku',
  'visualFlowEditor.validation.buildContainsBuild': 'BUILD nemůže obsahovat další blok BUILD',
  'visualFlowEditor.validation.buildContainsFlight': 'BUILD nemůže obsahovat blok FLIGHT',
  'visualFlowEditor.validation.flightContainsBuild': 'FLIGHT nemůže obsahovat blok BUILD',
  'visualFlowEditor.validation.flightContainsFlight': 'FLIGHT nemůže obsahovat další blok FLIGHT',
  'visualFlowEditor.validation.menuWithoutAsk': 'MENU musí předcházet blok ASK',
  'visualFlowEditor.validation.optOutsideMenu': 'OPT může být vložen pouze uvnitř bloku MENU',
  'visualFlowEditor.validation.genericError': 'Obecná chyba validace',
  'visualFlowEditor.validation.invalidPosition': 'Neplatná pozice pro tento blok',
  'visualFlowEditor.validation.missingRequired': 'Chybí povinná pole',
  
  // Error Modal
  'visualFlowEditor.errorModal.close': 'Zavřít',
  
  // Tools Panel
  'visualFlowEditor.tools.title': 'Nástroje',
  'visualFlowEditor.tools.searchPlaceholder': 'Hledat příkaz...',
  'visualFlowEditor.tools.dragInfo': '✋ Přetáhnout 🖱️ Info',
  
  // Tool Categories
  'visualFlowEditor.tools.category.general': 'Obecné',
  'visualFlowEditor.tools.category.constructs': 'Konstrukce',
  'visualFlowEditor.tools.category.flow': 'Tok',
  'visualFlowEditor.tools.category.variables': 'Proměnné',
  'visualFlowEditor.tools.category.display': 'Zobrazení',
  'visualFlowEditor.tools.category.input': 'Vstup',
  'visualFlowEditor.tools.category.audio': 'Audio',
  'visualFlowEditor.tools.category.animation': 'Animace',
  'visualFlowEditor.tools.category.combat': 'Boj',
  'visualFlowEditor.tools.category.game': 'Hra',
  'visualFlowEditor.tools.category.system': 'Systém',
  'visualFlowEditor.tools.category.special': 'Speciální',
  
  // JSON View
  'visualFlowEditor.jsonView.title': 'Zobrazení JSON',
  'visualFlowEditor.jsonView.copy': 'Kopírovat',
  'visualFlowEditor.jsonView.copied': 'Zkopírováno!',
  'visualFlowEditor.jsonView.close': 'Zavřít',
  
  // Block Actions
  'visualFlowEditor.addBlock': 'Přidat blok',
  'visualFlowEditor.deleteBlock': 'Smazat blok',
  'visualFlowEditor.moveUp': 'Přesunout nahoru',
  'visualFlowEditor.moveDown': 'Přesunout dolů',
  'visualFlowEditor.duplicate': 'Duplikovat',
  'visualFlowEditor.cut': 'Vyjmout',
  'visualFlowEditor.copy': 'Kopírovat',
  'visualFlowEditor.paste': 'Vložit',
  'visualFlowEditor.undo': 'Zpět',
  'visualFlowEditor.redo': 'Znovu',
  'visualFlowEditor.block.delete': 'Smazat',
  'visualFlowEditor.block.duplicate': 'Duplikovat',
  'visualFlowEditor.block.moveUp': 'Přesunout nahoru',
  'visualFlowEditor.block.moveDown': 'Přesunout dolů',
  'visualFlowEditor.block.zoomIn': 'Přiblížit',
  'visualFlowEditor.block.zoomOut': 'Oddálit',
  
  // Drag and Drop
  'visualFlowEditor.dragDrop.hint': 'Přetáhněte bloky pro změnu pořadí',
  'visualFlowEditor.dragDrop.dropHere': 'Přetáhněte sem',
  'visualFlowEditor.dragDrop.cannotDrop': 'Sem nelze přetáhnout',
  
  // Container
  'visualFlowEditor.container.then': 'Pak',
  'visualFlowEditor.container.else': 'Jinak',
  'visualFlowEditor.container.empty': 'Prázdný kontejner',
  
  // Block Types
  'visualFlowEditor.block.command': 'Příkaz',
  'visualFlowEditor.block.condition': 'Podmínka',
  'visualFlowEditor.block.container': 'Kontejner',
  'visualFlowEditor.block.special': 'Speciální',
  
  // General UI
  'visualFlowEditor.search': 'Hledat',
  'visualFlowEditor.searchPlaceholder': 'Hledat bloky...',
  'visualFlowEditor.noResults': 'Žádné výsledky nenalezeny',
  'visualFlowEditor.save': 'Uložit',
  'visualFlowEditor.cancel': 'Zrušit',
  'visualFlowEditor.confirmDelete': 'Opravdu chcete smazat tento blok?',
  'visualFlowEditor.unsavedChanges': 'Máte neuložené změny',
  'visualFlowEditor.loadError': 'Chyba při načítání dat',
  'visualFlowEditor.saveSuccess': 'Změny byly úspěšně uloženy',
  'visualFlowEditor.saveError': 'Chyba při ukládání změn',
  
  // Navigation Breadcrumb
  'visualFlowEditor.navigation.root': 'Kořen',
} as const;