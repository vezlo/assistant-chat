/**
 * Centralized theme configuration
 * Change these values to update colors across the entire application
 */

export const THEME = {
  // Primary brand color (emerald)
  primary: {
    hex: '#059669',
    tailwind: 'emerald',
  },
  
  // Tailwind color variants
  colors: {
    bg: 'bg-emerald-600',
    bgHover: 'bg-emerald-700',
    bgLight: 'bg-emerald-100',
    bgLighter: 'bg-emerald-50',
    text: 'text-emerald-600',
    textHover: 'text-emerald-700',
    textLight: 'text-emerald-100',
    border: 'border-emerald-600',
    borderLight: 'border-emerald-200',
  },
} as const;

// Helper function to get gradient for buttons
export const getButtonGradient = (color: string = THEME.primary.hex) => {
  return `linear-gradient(to right, ${color}, ${color}dd)`;
};

// Helper function to get header gradient
export const getHeaderGradient = (color: string = THEME.primary.hex) => {
  return `linear-gradient(to right, ${color}, ${color}dd, ${color}bb)`;
};


