export const interactiveMapStyles = {
  container: "w-full h-full flex flex-col bg-gradient-radial from-slate-800 to-slate-900 rounded-lg overflow-hidden",
  header: "p-4 bg-slate-800 bg-opacity-80 border-b border-gray-600 flex justify-between items-center flex-shrink-0",
  title: "text-lg font-bold text-white m-0",
  legend: "flex items-center gap-4 text-sm text-gray-300",
  legendItem: "flex items-center gap-2",
  legendDot: "w-4 h-4 rounded-full",
  viewport: "flex-1 w-full relative overflow-hidden",
  loading: {
    container: "flex flex-col items-center justify-center h-96 text-white",
    spinner: "w-12 h-12 border-2 border-transparent border-t-yellow-400 rounded-full animate-spin mb-4"
  },
  error: {
    container: "p-8 text-center text-red-500"
  }
};