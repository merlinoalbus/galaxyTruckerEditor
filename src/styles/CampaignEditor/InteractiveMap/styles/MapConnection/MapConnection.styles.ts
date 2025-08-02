export const mapConnectionStyles = {
  connectionGroup: "cursor-pointer transition-all duration-200",
  connectionLine: {
    className: "transition-all duration-200",
    getAttributes: (hasScripts: boolean, isSelected: boolean, isHovered: boolean) => ({
      stroke: hasScripts ? '#fbbf24' : '#64748b',
      strokeWidth: isSelected ? 4 : isHovered ? 3 : 2,
      strokeOpacity: hasScripts ? 0.8 : 0.4,
      strokeDasharray: hasScripts ? '0' : '5,5'
    })
  },
  costText: (isHovered: boolean) => `fill-white text-xs pointer-events-none ${isHovered ? 'font-bold' : ''}`,
  scriptIndicator: {
    r: 8,
    fill: '#fbbf24',
    stroke: '#1f2937',
    strokeWidth: 2,
    className: 'cursor-pointer'
  }
};