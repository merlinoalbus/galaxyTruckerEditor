export const visualFlowEditorStyles = {
  container: "h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden",
  header: {
    container: "p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center flex-shrink-0",
    title: "text-lg font-bold text-white",
    controls: "flex items-center gap-2"
  },
  workspace: {
    container: "flex-1 relative overflow-hidden bg-gray-850",
    canvas: "absolute inset-0",
    overlay: "absolute inset-0 pointer-events-none"
  },
  toolbar: {
    container: "p-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between",
    tools: "flex items-center gap-2",
    status: "text-sm text-gray-400"
  },
  addBlockMenu: {
    container: "absolute bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-2 min-w-48",
    header: "px-2 py-1 text-sm font-medium text-gray-300 border-b border-gray-600 mb-2",
    blockList: "space-y-1",
    blockItem: "flex items-center gap-2 px-2 py-1 text-sm text-white hover:bg-gray-700 rounded cursor-pointer transition-colors",
    blockIcon: "w-4 h-4 text-gray-400",
    blockLabel: "flex-1"
  },
  flowBlock: {
    container: (isSelected: boolean, isDragging: boolean) => `
      relative bg-gray-700 border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
      ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-600 hover:border-gray-500'}
      ${isDragging ? 'opacity-50 scale-105' : ''}
    `,
    header: "flex items-center justify-between mb-2",
    type: "text-xs font-medium text-gray-400 uppercase tracking-wide",
    controls: "flex items-center gap-1",
    content: "space-y-2",
    field: "space-y-1",
    label: "text-xs font-medium text-gray-300",
    input: "w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  }
};