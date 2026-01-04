/**
 * Toast notification constants
 * Centralized configuration for toast notifications to improve maintainability
 */

// Timing
export const TOAST_DEFAULT_DURATION_MS = 3000;
export const TOAST_ANIMATION_DURATION_MS = 200;
export const TOAST_SLIDE_OFFSET_PX = 10;

// Stacking & Limits
export const TOAST_MAX_STACK_SIZE = 3;

// Layout & Positioning
export const TOAST_CONTAINER_TOP = '1rem';
export const TOAST_CONTAINER_Z_INDEX = 9999;
export const TOAST_GAP = '0.5rem';
export const TOAST_INTERNAL_GAP = '0.75rem';

// Sizing
export const TOAST_MIN_WIDTH = '260px';
export const TOAST_MAX_WIDTH = '420px';
export const TOAST_MAX_WIDTH_VIEWPORT = '90vw';
export const TOAST_PADDING = '0.75rem 1rem';

// Styling
export const TOAST_BORDER_RADIUS = '999px'; // Pill shape
export const TOAST_PROGRESS_HEIGHT = '3px';

// Typography
export const TOAST_ICON_FONT_SIZE = '1.25rem';
export const TOAST_TITLE_FONT_SIZE = '0.95rem';
export const TOAST_MESSAGE_FONT_SIZE = '0.85rem';
export const TOAST_CLOSE_FONT_SIZE = '1rem';
export const TOAST_TITLE_FONT_WEIGHT = 600;
export const TOAST_MESSAGE_OPACITY = 0.9;

// Spacing
export const TOAST_ICON_MARGIN_TOP = '0.1rem';
export const TOAST_TITLE_MARGIN_BOTTOM = '0.1rem';
export const TOAST_CLOSE_MARGIN_LEFT = '0.5rem';

// Icons
export const TOAST_ICON_SUCCESS = '🌲';
export const TOAST_ICON_ERROR = '⚠️';
export const TOAST_ICON_INFO = 'ℹ️';

// Colors (for reference - used in CSS)
export const TOAST_COLORS = {
  success: {
    bg: '#022c22',
    border: 'rgba(34, 197, 94, 0.4)',
    progressStart: 'rgba(34, 197, 94, 0.9)',
    progressEnd: 'rgba(52, 211, 153, 0.75)',
  },
  info: {
    bg: '#0f172a',
  },
  error: {
    bg: '#450a0a',
    border: 'rgba(248, 113, 113, 0.5)',
  },
  default: {
    bg: '#0f172a',
    text: '#f9fafb',
    border: 'rgba(148, 163, 184, 0.35)',
    shadow: 'rgba(15, 23, 42, 0.45)',
  },
} as const;

// Shadow
export const TOAST_SHADOW = '0 12px 30px rgba(15, 23, 42, 0.45)';

// Task completion
export const TREES_PER_TASK = 1;

