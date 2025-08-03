export const scriptSelectorStyles = {
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
  emptyState: "p-8 text-center text-gray-400 text-sm"
};