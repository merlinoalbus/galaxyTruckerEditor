/**
 * Constants for Overview and Analysis Services
 * Centralized location for all magic numbers used in Overview components
 */

// Refactoring Service Constants
export const REFACTORING_CONSTANTS = {
  MIN_COMPLEXITY: 200, // Minimum complexity for refactoring candidates
  MAX_COMPLEXITY: 300, // Maximum complexity threshold
  DEFAULT_SCORE: 100, // Default scoring value
} as const;

// Quality Analysis Constants  
export const QUALITY_CONSTANTS = {
  WEIGHT_MULTIPLIER: 100, // Score weight multiplier
  DEFAULT_SCORE: 100, // Default quality score
  LARGE_SCRIPT_THRESHOLD: 500, // Threshold for oversized scripts
} as const;

// Maintenance Metrics Constants
export const MAINTENANCE_CONSTANTS = {
  TINY_THRESHOLD: 50, // Tiny component size
  SMALL_THRESHOLD: 100, // Small component size  
  MEDIUM_THRESHOLD: 200, // Medium component size
  LARGE_THRESHOLD: 300, // Large component size
  HUGE_THRESHOLD: 500, // Huge component size
  
  // Score values
  SCORE_TINY: 40, // Score for tiny scripts
  SCORE_SMALL: 60, // Score for small scripts
  SCORE_LARGE: 30, // Score for large scripts
  SCORE_OPTIMAL: 90, // Score for optimal size
  SCORE_MAX: 100, // Maximum score
  
  // Thresholds
  MIN_SCRIPT_SIZE: 20, // Minimum script size
  OPTIMAL_DEPENDENCIES: 2, // Optimal number of dependencies
  DEPENDENCY_PENALTY: 20, // Penalty per dependency deviation
  
  // Duplication thresholds
  DUPLICATION_HIGH: 8, // High duplication percentage
  DUPLICATION_MEDIUM: 5, // Medium duplication percentage
  DUPLICATION_PENALTY_HIGH: 30, // Penalty for high duplication
  DUPLICATION_PENALTY_MEDIUM: 20, // Penalty for medium duplication
  
  // Complexity factors
  COMPLEXITY_FACTOR_LOW: 1, // Low complexity factor
  COMPLEXITY_FACTOR_MEDIUM: 3, // Medium complexity factor
  COMPLEXITY_FACTOR_HIGH: 5, // High complexity factor
  
  // Percentages
  DUPLICATION_PERCENT_FACTOR: 10, // Factor for duplication percentage
  COMPLEXITY_SCORE_DIVISOR: 12, // Divisor for complexity score
  COUPLING_PENALTY: 20, // Penalty for coupling
} as const;

// Image Service Constants
export const IMAGE_CONSTANTS = {
  DEFAULT_THUMBNAIL_SIZE: 100, // Default thumbnail size in pixels
} as const;