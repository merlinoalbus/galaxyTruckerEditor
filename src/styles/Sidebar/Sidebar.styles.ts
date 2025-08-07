export const sidebarStyles = {
  container: (isCollapsed: boolean) => `
    ${isCollapsed ? 'w-16' : 'w-64'} 
    bg-gray-900 text-white h-full transition-all duration-300 ease-in-out
  `,
  header: 'p-4 border-b border-gray-700',
  content: 'overflow-y-auto',
  section: 'py-2',
  sectionTitle: 'px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider',
  item: 'px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors',
  itemActive: 'bg-gray-800 border-l-4 border-blue-500',
  itemLabel: (isCollapsed: boolean) => isCollapsed ? 'hidden' : 'ml-3',
  toggleButton: 'absolute top-4 right-4 p-2 hover:bg-gray-800 rounded'
};