import { MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export type VariableValue = string | number | boolean;

export interface GameState {
  unlockedRoutes: Set<string>;
  completedMissions: Set<string>;
  variables: Map<string, VariableValue>;
  semafori: Map<string, boolean>;
}

export class RouteVisibilityService {
  private static instance: RouteVisibilityService;
  private gameState: GameState;

  private constructor() {
    this.gameState = {
      unlockedRoutes: new Set(),
      completedMissions: new Set(),
      variables: new Map(),
      semafori: new Map()
    };
  }

  static getInstance(): RouteVisibilityService {
    if (!RouteVisibilityService.instance) {
      RouteVisibilityService.instance = new RouteVisibilityService();
    }
    return RouteVisibilityService.instance;
  }

  updateGameState(newState: Partial<GameState>) {
    if (newState.unlockedRoutes) {
      this.gameState.unlockedRoutes = new Set([...this.gameState.unlockedRoutes, ...newState.unlockedRoutes]);
    }
    if (newState.completedMissions) {
      this.gameState.completedMissions = new Set([...this.gameState.completedMissions, ...newState.completedMissions]);
    }
    if (newState.variables) {
      newState.variables.forEach((value, key) => {
        this.gameState.variables.set(key, value);
      });
    }
    if (newState.semafori) {
      newState.semafori.forEach((value, key) => {
        this.gameState.semafori.set(key, value);
      });
    }
  }

  isRouteVisible(connection: MapConnection): boolean {
    if (!connection.visibilityCondition) {
      return true; // Default to visible if no condition
    }

    const condition = connection.visibilityCondition;
    const routeId = `${connection.from}-${connection.to}`;

    switch (condition.type) {
      case 'always':
        return true;
      
      case 'never':
        return false;
      
      case 'unlocked':
        return this.gameState.unlockedRoutes.has(routeId);
      
      case 'completed':
        if (condition.variable) {
          return this.gameState.completedMissions.has(condition.variable);
        }
        return false;
      
      case 'available':
        // Check if route is available based on script conditions
        if (condition.scriptCondition) {
          return this.evaluateScriptCondition(condition.scriptCondition);
        }
        if (condition.variable) {
          return this.gameState.semafori.get(condition.variable) === true;
        }
        return true;
      
      default:
        return true;
    }
  }

  private evaluateScriptCondition(scriptCondition: string): boolean {
    // Simple script condition evaluation
    // In a real implementation, this would parse and evaluate complex script conditions
    
    // Handle basic variable checks
    if (scriptCondition.startsWith('IF ')) {
      const variable = scriptCondition.substring(3).trim();
      return this.gameState.semafori.get(variable) === true;
    }
    
    if (scriptCondition.startsWith('IFNOT ')) {
      const variable = scriptCondition.substring(6).trim();
      return this.gameState.semafori.get(variable) !== true;
    }

    // Handle numeric conditions
    if (scriptCondition.startsWith('IF_MIN ')) {
      const parts = scriptCondition.substring(7).trim().split(' ');
      const variable = parts[0];
      const minValue = parseInt(parts[1] || '0');
      const currentValue = this.gameState.variables.get(variable) || 0;
      return currentValue >= minValue;
    }

    if (scriptCondition.startsWith('IF_MAX ')) {
      const parts = scriptCondition.substring(7).trim().split(' ');
      const variable = parts[0];
      const maxValue = parseInt(parts[1] || '0');
      const currentValue = this.gameState.variables.get(variable) || 0;
      return currentValue <= maxValue;
    }

    return true; // Default to true for unknown conditions
  }

  filterVisibleConnections(connections: MapConnection[]): MapConnection[] {
    return connections.map(connection => ({
      ...connection,
      isVisible: this.isRouteVisible(connection)
    }));
  }

  unlockRoute(from: string, to: string) {
    const routeId = `${from}-${to}`;
    this.gameState.unlockedRoutes.add(routeId);
  }

  completeMission(missionName: string) {
    this.gameState.completedMissions.add(missionName);
  }

  setVariable(name: string, value: VariableValue) {
    this.gameState.variables.set(name, value);
  }

  setSemaforo(name: string, value: boolean) {
    this.gameState.semafori.set(name, value);
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  resetGameState() {
    this.gameState = {
      unlockedRoutes: new Set(),
      completedMissions: new Set(),
      variables: new Map(),
      semafori: new Map()
    };
  }
}