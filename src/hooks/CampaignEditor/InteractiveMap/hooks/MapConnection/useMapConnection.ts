import { useMemo } from 'react';
import { MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { MISSION_CONFIG } from '@/config/constants';

interface Position {
  x: number;
  y: number;
}

export const useMapConnection = (
  connection: MapConnection,
  fromPosition: Position,
  toPosition: Position,
  shipPosition?: Position,
  relatedScripts: any[] = []
) => {
  const connectionState = useMemo(() => ({
    hasScripts: relatedScripts.length > 0,
    midX: (fromPosition.x + toPosition.x) / 2,
    midY: (fromPosition.y + toPosition.y) / 2,
    isVisible: connection.isVisible !== false
  }), [relatedScripts, fromPosition, toPosition, connection.isVisible]);

  const calculateShipPosition = useMemo(() => {
    const lineLength = Math.sqrt(
      Math.pow(toPosition.x - fromPosition.x, 2) + 
      Math.pow(toPosition.y - fromPosition.y, 2)
    );
    
    let position = 0.5;
    const minDistance = 60;
    const positions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8];
    
    for (const pos of positions) {
      const testX = fromPosition.x + (toPosition.x - fromPosition.x) * pos;
      const testY = fromPosition.y + (toPosition.y - fromPosition.y) * pos;
      
      const distFromStart = Math.sqrt(
        Math.pow(testX - fromPosition.x, 2) + 
        Math.pow(testY - fromPosition.y, 2)
      );
      const distFromEnd = Math.sqrt(
        Math.pow(testX - toPosition.x, 2) + 
        Math.pow(testY - toPosition.y, 2)
      );
      
      if (distFromStart >= minDistance && distFromEnd >= minDistance) {
        position = pos;
        break;
      }
    }
    
    return {
      x: fromPosition.x + (toPosition.x - fromPosition.x) * position,
      y: fromPosition.y + (toPosition.y - fromPosition.y) * position
    };
  }, [fromPosition, toPosition]);

  const finalShipPosition = shipPosition || calculateShipPosition;

  const licenseConfig = useMemo(() => 
    connection.license ? MISSION_CONFIG.LICENSE_CLASSES[connection.license] : null,
    [connection.license]
  );

  const handleClick = (event: React.MouseEvent, onClick: (connection: MapConnection) => void) => {
    event.stopPropagation();
    onClick(connection);
  };

  return {
    connectionState,
    finalShipPosition,
    licenseConfig,
    handleClick
  };
};