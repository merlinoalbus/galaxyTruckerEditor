export const variablesSystemStyles = {
  container: 'p-6 h-full overflow-auto',
  
  header: {
    title: 'text-xl font-bold text-white mb-6',
    subtitle: 'text-gray-400 text-sm mb-6'
  },

  controls: {
    container: 'flex flex-wrap gap-4 mb-6 p-4 bg-gt-secondary rounded-lg border border-gray-700',
    searchInput: 'flex-1 min-w-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gt-accent',
    filterSelect: 'px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gt-accent',
    sortSelect: 'px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gt-accent'
  },

  stats: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6',
    card: 'bg-gt-secondary rounded-lg p-4 border border-gray-700',
    title: 'text-gt-accent font-semibold text-sm uppercase tracking-wide mb-1',
    value: 'text-white text-xl font-bold',
    subtitle: 'text-gray-400 text-xs mt-1'
  },

  variablesList: {
    container: 'space-y-3',
    item: 'bg-gt-secondary rounded-lg p-4 border border-gray-700 hover:border-gt-accent transition-colors',
    header: 'flex items-center justify-between mb-2',
    name: 'text-white font-semibold',
    type: {
      base: 'text-xs px-2 py-1 rounded-full font-medium',
      semaforo: 'bg-blue-900 text-blue-300',
      variable: 'bg-green-900 text-green-300'
    },
    category: 'text-gt-accent text-sm font-medium',
    description: 'text-gray-400 text-sm mb-2',
    usage: {
      container: 'mt-2',
      title: 'text-gray-300 text-xs font-medium mb-1',
      list: 'flex flex-wrap gap-1',
      item: 'text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 hover:bg-gray-600 transition-colors'
    }
  },

  emptyState: {
    container: 'flex flex-col items-center justify-center h-64 text-center',
    icon: 'text-gray-600 mb-4',
    title: 'text-gray-400 text-lg font-medium',
    subtitle: 'text-gray-500 text-sm'
  },

  loadingState: 'flex items-center justify-center h-64 text-gray-400',

  categoryBadge: {
    Mission: 'bg-purple-900 text-purple-300',
    Character: 'bg-yellow-900 text-yellow-300',
    Inventory: 'bg-indigo-900 text-indigo-300',
    Quest: 'bg-orange-900 text-orange-300',
    State: 'bg-red-900 text-red-300',
    Counter: 'bg-cyan-900 text-cyan-300',
    General: 'bg-gray-700 text-gray-300'
  }
};