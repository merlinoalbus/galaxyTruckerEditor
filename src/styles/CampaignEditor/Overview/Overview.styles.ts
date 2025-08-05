export const overviewStyles = {
  container: 'p-8 h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
  
  hero: {
    container: 'text-center mb-12 relative',
    title: 'text-4xl font-bold text-white mb-4 galaxy-title galaxy-title-main',
    subtitle: 'text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed',
    decoration: 'absolute inset-0 bg-gradient-to-r from-transparent via-gt-accent/10 to-transparent blur-3xl -z-10'
  },

  metricsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12',
  
  metricCard: {
    container: 'group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-gt-accent/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-gt-accent/20',
    iconContainer: 'flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-gt-accent/20 to-gt-accent/10 border border-gt-accent/30',
    icon: 'w-7 h-7 text-gt-accent group-hover:scale-110 transition-transform duration-300',
    value: 'text-3xl font-bold text-white mb-2 galaxy-title',
    label: 'text-sm text-gray-400 uppercase tracking-wider font-semibold',
    accent: 'absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gt-accent/50 to-transparent rounded-t-2xl'
  },

  section: {
    container: 'mb-12',
    header: 'flex items-center space-x-3 mb-6',
    icon: 'w-6 h-6 text-gt-accent',
    title: 'text-2xl font-bold text-white galaxy-title',
    content: 'bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50'
  },

  languageGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  languageItem: {
    container: 'flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-gt-accent/30 transition-colors duration-200',
    left: 'flex items-center space-x-3',
    flag: 'w-6 h-6 rounded-full bg-gradient-to-br from-gt-accent/30 to-gt-accent/10 flex items-center justify-center text-xs font-bold text-gt-accent',
    language: 'text-white font-semibold',
    right: 'flex items-center space-x-3',
    count: 'text-gray-300 text-sm',
    percentage: 'text-gt-accent font-bold text-sm'
  },

  complexityList: {
    container: 'space-y-4',
    item: 'flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-700/20',
    label: 'text-gray-300 font-medium',
    value: 'text-white font-bold text-lg',
    highlight: 'text-gt-accent font-bold text-lg'
  },

  loadingState: 'flex flex-col items-center justify-center h-96 text-gray-400',
  loadingSpinner: 'w-8 h-8 animate-spin text-gt-accent mb-4',
  loadingText: 'text-lg font-medium',

  emptyState: {
    container: 'flex flex-col items-center justify-center h-96 text-center max-w-md mx-auto',
    icon: 'w-24 h-24 text-slate-600 mb-6',
    title: 'text-2xl font-bold text-gray-400 mb-4 galaxy-title',
    subtitle: 'text-gray-500 leading-relaxed',
    action: 'mt-6 px-6 py-3 bg-gt-accent hover:bg-gt-accent/80 text-white rounded-xl font-semibold transition-colors duration-200'
  },

  badge: {
    primary: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gt-accent/20 text-gt-accent border border-gt-accent/30',
    secondary: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-gray-300 border border-slate-600/50'
  }
};