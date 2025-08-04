export const scriptSelectorStyles = {
  // Base styles (mantenuti per retrocompatibilità)
  overlay: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50",
  modal: "bg-gray-800 rounded-lg border border-gray-700 w-[90%] max-w-lg max-h-[70vh] flex flex-col shadow-2xl",
  header: "px-4 py-3 border-b border-gray-700 flex justify-between items-center",
  title: "text-lg font-medium text-white m-0",
  closeButton: "bg-transparent border-none text-gray-400 hover:text-white cursor-pointer p-1 rounded-md hover:bg-gray-700 transition-colors",
  searchContainer: "p-3 border-b border-gray-700",
  searchInput: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  scriptList: "flex-1 overflow-y-auto p-2 max-h-80",
  scriptItem: "px-3 py-2 m-1 bg-gray-700 rounded-md cursor-pointer transition-all duration-200 hover:bg-blue-600 border border-transparent flex items-center gap-3",
  startScriptItem: "px-3 py-2 m-1 bg-gray-700 border border-yellow-500 rounded-md cursor-pointer transition-all duration-200 hover:bg-blue-600 flex items-center gap-3",
  scriptName: "font-medium text-white flex-1",
  scriptFile: "text-xs text-gray-300 bg-gray-600 px-2 py-1 rounded-full",
  separator: "mx-2 my-2 border-t border-gray-600",
  separatorLabel: "px-3 py-1 text-xs text-gray-400 font-medium uppercase tracking-wide",
  emptyState: "p-8 text-center text-gray-400 text-sm",
  
  // Enhanced styles per il nuovo layout
  modalEnhanced: "bg-gray-900 rounded-xl border border-gray-700 w-[90%] max-w-4xl max-h-[80vh] flex flex-col shadow-2xl backdrop-blur-sm",
  headerEnhanced: "px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl",
  titleEnhanced: "text-xl font-semibold text-white m-0",
  closeButtonEnhanced: "bg-transparent border-none text-gray-400 hover:text-white cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-all duration-200",
  searchContainerEnhanced: "p-4 bg-gray-800 border-b border-gray-700",
  searchInputEnhanced: "w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
  
  // Layout a due colonne
  contentWrapper: "flex flex-1 overflow-hidden",
  column: "flex-1 flex flex-col min-w-0",
  centerDivider: "w-px bg-gray-700",
  
  // Headers delle colonne
  columnHeader: "px-4 py-3 bg-gradient-to-r from-orange-900/20 to-amber-900/20 border-b border-gray-700 flex items-center gap-2 text-orange-400 font-medium",
  columnHeaderMission: "px-4 py-3 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-b border-gray-700 flex items-center gap-2 text-blue-400 font-medium",
  
  // Contenitore lista scrollabile
  listContainer: "flex-1 overflow-y-auto p-3",
  
  // Label sezioni
  sectionLabel: "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2",
  
  // Items Scripts
  scriptItemStar: "px-3 py-3 mb-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-lg cursor-pointer transition-all duration-200 hover:bg-amber-800/40 hover:border-amber-600 flex items-center gap-3 group",
  
  // Items Missions  
  missionItem: "px-3 py-3 mb-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/50 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-800/40 hover:border-blue-600 flex items-center gap-3 group",
  missionItemUnique: "px-3 py-3 mb-2 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg cursor-pointer transition-all duration-200 hover:bg-purple-800/40 hover:border-purple-600 flex items-center gap-3 group",
  
  // Dettagli items
  itemName: "font-medium text-white group-hover:text-blue-200 transition-colors",
  itemFile: "text-xs text-gray-400 mt-0.5",
  itemDetails: "flex items-center gap-2 mt-1",
  
  // Tags
  badge: "text-xs bg-gray-700 px-2 py-0.5 rounded-full",
  licenseTag: (license?: string) => {
    const baseClass = "text-xs px-2 py-0.5 rounded-full font-medium";
    switch (license) {
      case 'STIII': return `${baseClass} bg-red-900/50 text-red-400 border border-red-800/50`;
      case 'STII': return `${baseClass} bg-yellow-900/50 text-yellow-400 border border-yellow-800/50`;
      case 'STI': 
      default: return `${baseClass} bg-green-900/50 text-green-400 border border-green-800/50`;
    }
  },
  buttonTag: "text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300",
  
  // Divider
  divider: "my-3 border-t border-gray-700"
};