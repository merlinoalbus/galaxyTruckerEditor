export const overviewStyles = {
  container: 'p-6 h-full overflow-auto',
  
  header: {
    title: 'text-xl font-bold text-white mb-6',
    subtitle: 'text-gray-400 text-sm mb-4'
  },

  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6',
  
  statCard: {
    base: 'bg-gt-secondary rounded-lg p-4 border border-gray-700',
    title: 'text-gt-accent font-semibold text-sm uppercase tracking-wide mb-2',
    value: 'text-white text-2xl font-bold',
    subtitle: 'text-gray-400 text-sm mt-1'
  },

  section: {
    container: 'mb-8',
    title: 'text-lg font-semibold text-white mb-4',
    content: 'bg-gt-secondary rounded-lg p-4 border border-gray-700'
  },

  list: {
    container: 'space-y-2',
    item: 'flex justify-between items-center py-2 px-3 bg-gray-800 rounded',
    label: 'text-gray-300',
    value: 'text-white font-semibold'
  },

  progress: {
    container: 'w-full bg-gray-700 rounded-full h-2',
    bar: 'bg-gt-accent h-2 rounded-full transition-all duration-300'
  },

  loadingState: 'flex items-center justify-center h-64 text-gray-400',
  emptyState: {
    container: 'flex flex-col items-center justify-center h-64 text-center',
    icon: 'text-gray-600 mb-4',
    title: 'text-gray-400 text-lg font-medium',
    subtitle: 'text-gray-500 text-sm'
  }
};