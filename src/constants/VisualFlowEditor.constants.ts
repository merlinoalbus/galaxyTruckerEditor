/**
 * Constants for Visual Flow Editor
 * Centralized location for all magic numbers used in VisualFlowEditor
 */

// Supported languages for Galaxy Trucker
export const SUPPORTED_LANGUAGES = ['EN', 'IT', 'DE', 'ES', 'FR', 'PL', 'CS', 'RU'] as const;

// Timeout and debouncing constants
export const TIMEOUT_CONSTANTS = {
  HIGHLIGHT_DURATION: 2000, // ms - Duration for block highlighting
  VALIDATION_DEBOUNCE: 300, // ms - Debounce delay for validation
  SAFE_TIMEOUT_DEFAULT: 1000, // ms - Default timeout for safe operations
  SAFE_REGEX_TIMEOUT: 2000, // ms - Timeout for regex operations
  ERROR_MODAL_DURATION: 5000, // ms - Duration for error modal display
  SCROLL_DELAY: 100, // ms - Delay before scrolling to element
  COPY_FEEDBACK_DURATION: 2000, // ms - Duration for copy feedback
  MODAL_ANIMATION_DURATION: 300, // ms - Duration for modal animations
  NOTIFICATION_DURATION: 1500, // ms - Duration for notifications
  FOCUS_DELAY: 200, // ms - Delay before focus operations
} as const;

// Performance thresholds
export const PERFORMANCE_CONSTANTS = {
  LARGE_SCRIPT_THRESHOLD: 1000, // blocks - Threshold for performance monitoring
  MAX_CONCURRENT_TIMEOUTS: 50, // Maximum number of concurrent timeouts
  HIGH_TIMEOUT_WARNING: 20, // Threshold for timeout count warning
  MAX_RECURSION_DEPTH: 100, // Maximum recursion depth for tree traversal
} as const;

// Regex execution limits
export const REGEX_CONSTANTS = {
  MAX_ITERATIONS: 1000, // Maximum regex iterations
  GENDER_PATTERN_ITERATIONS: 500, // Max iterations for gender patterns
  NUMBER_PATTERN_ITERATIONS: 500, // Max iterations for number patterns
  IMAGE_PATTERN_ITERATIONS: 500, // Max iterations for image patterns
  NAME_PATTERN_ITERATIONS: 1000, // Max iterations for name patterns
  GENDER_PATTERN_TIMEOUT: 1000, // ms
  NUMBER_PATTERN_TIMEOUT: 1000, // ms
  IMAGE_PATTERN_TIMEOUT: 1000, // ms
  NAME_PATTERN_TIMEOUT: 500, // ms
} as const;

// UI Constants
export const UI_CONSTANTS = {
  RING_WIDTH_HIGHLIGHT: 2, // Tailwind ring width for highlighting
  RING_OFFSET: 2, // Tailwind ring offset
  RING_WIDTH_ERROR: 4, // Tailwind ring width for error highlighting
  ICON_SIZE: 16, // Size for icons (w-16 h-16)
  DEFAULT_POSITION_X: 100, // Default X position for elements
  DEFAULT_POSITION_Y: 100, // Default Y position for elements
} as const;

// API Constants
export const API_CONSTANTS = {
  DEFAULT_PORT: 3001, // Default backend port
} as const;