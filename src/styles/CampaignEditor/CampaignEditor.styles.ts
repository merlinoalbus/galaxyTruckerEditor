export const campaignEditorStyles = {
  container: "h-full flex flex-col gap-6",
  header: {
    container: "flex items-center justify-between flex-shrink-0",
    title: {
      container: "space-y-1",
      main: "text-2xl font-bold text-white",
      subtitle: "text-gray-400"
    },
    saveButton: "flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
  },
  stats: {
    container: "grid grid-cols-4 gap-4 flex-shrink-0",
    card: "bg-gt-secondary rounded-lg p-4",
    value: "text-gt-accent font-bold text-lg"
  },
  tabs: {
    container: "border-b border-gray-700 flex-shrink-0",
    list: "flex space-x-8",
    tab: (isActive: boolean) => `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
      isActive
        ? 'border-gt-accent text-gt-accent'
        : 'border-transparent text-gray-400 hover:text-gray-300'
    }`
  },
  content: {
    container: "bg-gt-primary rounded-lg flex-1 min-h-0"
  }
};