import { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export interface NodeOverlapConfig {
  minDistance: number;
  maxAttempts: number;
}

const DEFAULT_CONFIG: NodeOverlapConfig = {
  minDistance: 80,
  maxAttempts: 10
};

/**
 * Resolves overlapping nodes by adjusting their positions
 * @param nodes Array of nodes to adjust
 * @param config Configuration for overlap resolution
 * @returns Array of adjusted nodes
 */
export const resolveNodeOverlaps = (
  nodes: MapNode[], 
  config: NodeOverlapConfig = DEFAULT_CONFIG
): MapNode[] => {
  const adjustedNodes = [...nodes];
  const { minDistance } = config;
  
  for (let i = 0; i < adjustedNodes.length; i++) {
    for (let j = i + 1; j < adjustedNodes.length; j++) {
      const nodeA = adjustedNodes[i];
      const nodeB = adjustedNodes[j];
      
      const distance = calculateDistance(nodeA.coordinates, nodeB.coordinates);
      
      if (distance < minDistance) {
        adjustNodePositions(nodeA, nodeB, minDistance, distance);
      }
    }
  }
  
  return adjustedNodes;
};

/**
 * Calculates the distance between two coordinate points
 */
const calculateDistance = (coordsA: [number, number], coordsB: [number, number]): number => {
  return Math.sqrt(
    Math.pow(coordsA[0] - coordsB[0], 2) + 
    Math.pow(coordsA[1] - coordsB[1], 2)
  );
};

/**
 * Adjusts positions of two overlapping nodes
 */
const adjustNodePositions = (
  nodeA: MapNode, 
  nodeB: MapNode, 
  minDistance: number, 
  currentDistance: number
): void => {
  const angle = Math.atan2(
    nodeB.coordinates[1] - nodeA.coordinates[1],
    nodeB.coordinates[0] - nodeA.coordinates[0]
  );
  
  const adjustmentDistance = (minDistance - currentDistance) / 2 + 5;
  
  // Move both nodes apart
  nodeA.coordinates[0] -= Math.cos(angle) * adjustmentDistance;
  nodeA.coordinates[1] -= Math.sin(angle) * adjustmentDistance;
  nodeB.coordinates[0] += Math.cos(angle) * adjustmentDistance;
  nodeB.coordinates[1] += Math.sin(angle) * adjustmentDistance;
};