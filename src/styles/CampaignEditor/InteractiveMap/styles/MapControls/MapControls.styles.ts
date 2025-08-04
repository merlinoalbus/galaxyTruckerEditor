export const mapControlsStyles = {
  // Container originale (mantenuto per retrocompatibilità)
  container: "absolute top-4 right-4 flex flex-col gap-2 z-50",
  
  // Container chiudibile con stile consistente alla legenda
  containerCollapsible: "absolute top-4 right-4 bg-gray-900 bg-opacity-90 border border-gray-700 rounded-lg z-10 text-xs",
  
  // Header chiudibile
  header: "flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800 hover:bg-opacity-50 transition-colors",
  headerContent: "flex items-center gap-2 text-gray-400",
  headerTitle: "uppercase tracking-wider text-xs font-semibold",
  
  // Wrapper controlli
  controlsWrapper: "flex flex-col gap-2 p-3 pt-0",
  
  // Riga per raggruppare controlli
  row: "flex gap-2",
  
  // Display del valore zoom corrente - larghezza fissa come i pulsanti
  zoomDisplay: "w-11 h-11 bg-slate-800 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg flex items-center justify-center",
  zoomText: "text-sm font-semibold text-yellow-400",
  
  // Pulsanti moderni con tema scuro
  controlButton: "w-11 h-11 bg-slate-800 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-300 hover:bg-slate-700 hover:border-yellow-500 hover:text-yellow-400 active:bg-slate-900 active:scale-95 transition-all duration-200 cursor-pointer group",
  
  // Label per il pulsante 100%
  zoomLabel: "text-xs font-bold",
  
  // Stato disabilitato
  disabled: "opacity-40 cursor-not-allowed bg-slate-900 hover:bg-slate-900 hover:border-gray-700 hover:text-gray-500 active:bg-slate-900 active:scale-100"
};