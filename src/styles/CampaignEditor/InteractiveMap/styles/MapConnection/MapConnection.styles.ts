export const mapConnectionStyles = {
  connectionGroup: "cursor-pointer transition-all duration-200",
  connectionLine: {
    className: "transition-all duration-200",
    getAttributes: (hasScripts: boolean, isSelected: boolean, isHovered: boolean, flightClass?: string) => {
      // Color by flight class
      let stroke = '#64748b'; // Default gray
      if (hasScripts) {
        stroke = '#fbbf24'; // Script available - amber
      } else if (flightClass) {
        switch (flightClass) {
          case 'I': stroke = '#10b981'; break;   // Class I - emerald (easy)
          case 'II': stroke = '#3b82f6'; break;  // Class II - blue (medium)
          case 'III': stroke = '#f59e0b'; break; // Class III - amber (hard)
          case 'IV': stroke = '#ef4444'; break;  // Class IV - red (very hard)
          default: stroke = '#64748b';
        }
      }
      
      return {
        stroke,
        strokeWidth: isSelected ? 4 : isHovered ? 3 : 2,
        strokeOpacity: hasScripts ? 0.9 : flightClass ? 0.7 : 0.4,
        strokeDasharray: hasScripts ? '0' : flightClass ? '0' : '5,5'
      };
    }
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