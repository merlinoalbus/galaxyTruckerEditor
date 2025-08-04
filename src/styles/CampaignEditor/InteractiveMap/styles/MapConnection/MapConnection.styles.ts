export const mapConnectionStyles = {
  connectionGroup: "cursor-pointer transition-all duration-200",
  connectionLine: {
    className: "transition-all duration-200",
    getAttributes: (hasScripts: boolean, isSelected: boolean, isHovered: boolean, license?: string, missionType?: string) => {
      // Color by license
      let stroke = '#64748b'; // Default gray
      if (license) {
        switch (license) {
          case 'STI': stroke = '#22c55e'; break;    // STI - green (easy)
          case 'STII': stroke = '#eab308'; break;   // STII - yellow (medium)
          case 'STIII': stroke = '#ef4444'; break;  // STIII - red (hard)
          default: stroke = '#64748b';
        }
      }
      
      // Dasharray by mission type
      const strokeDasharray = missionType === 'UNIQUE' ? '5,5' : '0';
      
      return {
        stroke,
        strokeWidth: isSelected ? 4 : isHovered ? 3 : 2,
        strokeOpacity: isSelected || isHovered ? 0.9 : 0.7,
        strokeDasharray
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