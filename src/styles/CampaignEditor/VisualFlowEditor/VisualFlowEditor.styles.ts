export const visualFlowEditorStyles = {
  container: 'h-full flex flex-col bg-gt-primary',
  
  loadingState: 'flex items-center justify-center h-full space-x-3 text-gray-400',
  
  header: {
    container: 'flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50',
    titleSection: 'flex items-center space-x-3',
    icon: 'w-6 h-6 text-gt-accent',
    title: 'text-lg font-semibold text-white galaxy-title',
    subtitle: 'text-sm text-gray-400',
    actions: 'flex items-center space-x-2'
  },
  
  button: {
    primary: 'flex items-center space-x-2 bg-gt-accent hover:bg-gt-accent/80 text-white px-4 py-2 rounded-lg font-medium transition-colors',
    secondary: 'flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors'
  },
  
  placeholder: {
    container: 'flex-1 flex items-center justify-center p-8',
    content: 'max-w-lg text-center space-y-6',
    icon: 'flex justify-center text-slate-600',
    title: 'text-2xl font-bold text-white',
    description: 'text-gray-400 leading-relaxed',
    features: 'space-y-3 text-left',
    feature: 'flex items-start space-x-3 text-gray-300',
    featureBullet: 'text-gt-accent font-bold text-lg leading-none',
    status: 'flex justify-center',
    statusBadge: 'inline-flex items-center px-3 py-1 bg-yellow-900/50 text-yellow-300 rounded-full text-sm font-medium border border-yellow-600/30'
  }
};