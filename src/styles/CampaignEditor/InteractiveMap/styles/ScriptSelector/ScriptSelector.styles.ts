export const scriptSelectorStyles = {
  overlay: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50",
  modal: "bg-gray-800 rounded-lg border border-gray-600 w-[90%] max-w-2xl max-h-[80vh] flex flex-col shadow-2xl",
  header: "p-6 border-b border-gray-600 flex justify-between items-center",
  title: "text-xl font-bold text-white m-0",
  closeButton: "bg-transparent border-none text-gray-400 hover:text-white cursor-pointer p-2",
  searchContainer: "p-4 border-b border-gray-600",
  searchInput: "w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:border-yellow-400",
  scriptList: "flex-1 overflow-y-auto p-2",
  scriptItem: "p-4 m-1 bg-gray-600 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-500",
  scriptName: "font-bold text-white mb-1",
  scriptFile: "text-xs text-gray-400 mb-2",
  scriptPreview: "text-sm text-gray-300 italic",
  emptyState: "p-8 text-center text-gray-400"
};