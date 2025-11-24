/**
 * Centralized theme configuration
 * Change these values to update colors across the entire application
 */

export const THEME = {
  // Primary brand color (emerald/teal)
  primary: {
    hex: '#059669',
    tailwind: 'emerald',
    // Color variants for different use cases
    darker: '#047857', // For hover states
    lighter: '#10b981', // For accents
    lightest: '#d1fae5', // For backgrounds
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
  
  // Typography
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: {
      weight: '600',
      size: {
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
      },
    },
    body: {
      weight: '400',
      size: {
        sm: '0.75rem',
        md: '0.875rem',
        lg: '1rem',
      },
    },
  },
  
  // Spacing (for consistency)
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
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

// Helper function to get darker shade for hover states
export const getHoverColor = () => THEME.primary.darker;


