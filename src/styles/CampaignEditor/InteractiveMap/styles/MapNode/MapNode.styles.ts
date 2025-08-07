export const mapNodeStyles = {
  nodeGroup: "cursor-pointer transition-all duration-200 hover:brightness-110",
  nodeCircle: {
    className: "transition-all duration-200",
    getAttributes: (hasScripts: boolean, isSelected: boolean, radius: number) => ({
      r: radius,
      fill: hasScripts ? '#fbbf24' : '#374151',
      stroke: isSelected ? '#fbbf24' : hasScripts ? '#f59e0b' : '#6b7280',
      strokeWidth: isSelected ? 4 : 2
    })
  },
  nodeImage: {
    r: 25,
    fill: '#1f2937',
    stroke: '#4b5563',
    strokeWidth: 1,
    className: 'pointer-events-none'
  },
  nodeText: (isHovered: boolean) => ({
    className: `fill-white text-sm pointer-events-none ${isHovered ? 'font-bold' : ''}`,
    style: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: isHovered ? 'bold' : 'normal',
      fontVariant: 'small-caps'
    }
  }),
  scriptCount: {
    group: "cursor-pointer",
    circle: {
      r: 12,
      fill: '#ef4444',
      stroke: '#1f2937',
      strokeWidth: 2
    },
    text: "fill-white text-xs font-bold pointer-events-none"
  },
  buttonIndicator: {
    r: 8,
    fill: '#22c55e',
    stroke: '#1f2937',
    strokeWidth: 2,
    className: 'cursor-pointer'
  }
};