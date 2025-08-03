export const API_CONFIG = {
  BE_HOST: 'http://localhost',
  BE_PORT: 3001,
  FE_HOST: 'http://localhost',
  FE_PORT: 3000,
  get BE_BASE_URL() {
    return `${this.BE_HOST}:${this.BE_PORT}`;
  },
  get FE_BASE_URL() {
    return `${this.FE_HOST}:${this.FE_PORT}`;
  },
  get API_BASE_URL() {
    return `${this.BE_BASE_URL}/api`;
  },
  get ASSETS_BASE_URL() {
    return `${this.BE_BASE_URL}/static`;
  }
} as const;

export const PATHS = {
  CAMPAIGN: {
    MAP: '/campaign/campaignMap',
    BIG: '/campaign/campaignMap/big',
    TUTORIALS: '/campaign/tutorials.txt'
  },
  FLIGHT_CLASSES: {
    I: 'class1',
    II: 'class2', 
    III: 'class3',
    IV: 'class4'
  },
  IMAGES: {
    STATION: '/campaign/campaignMap/big/station.png',
    CASH: '/final/cash.png',
    get SHIP_CLASS_ICON() {
      return (shipImage: string) => `/campaign/campaignMap/${shipImage}.cacheship.png`;
    }
  }
} as const;

export const MISSION_CONFIG = {
  VISIBILITY_CONDITIONS: {
    UNLOCKED: 'unlocked',
    COMPLETED: 'completed',
    AVAILABLE: 'available'
  },
  LICENSE_CLASSES: {
    STI: { id: 'I', name: 'Class I', difficulty: 1, shipImage: 'shipI' },
    STII: { id: 'II', name: 'Class II', difficulty: 2, shipImage: 'shipII' },
    STIII: { id: 'III', name: 'Class III', difficulty: 3, shipImage: 'shipIII' }
  },
  MISSION_TYPES: {
    NORMAL: 'standard',
    UNIQUE: 'special'
  }
} as const;