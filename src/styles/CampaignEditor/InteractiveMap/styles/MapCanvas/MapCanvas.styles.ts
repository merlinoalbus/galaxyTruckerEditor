export const mapCanvasStyles = {
  svg: (isDragging: boolean) => `w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`,
  background: {
    fill: 'url(#mapGradient)'
  },
  gradient: {
    id: 'mapGradient',
    cx: '50%',
    cy: '50%',
    r: '50%',
    stops: [
      { offset: '0%', stopColor: '#1e293b', stopOpacity: 1 },
      { offset: '100%', stopColor: '#0f172a', stopOpacity: 1 }
    ]
  }
};