// src/styles/design-tokens.js
// Find A Day Design Token System
// This file is the SINGLE SOURCE OF TRUTH for all visual properties.
// All components should reference these tokens. Never hardcode colors.

export const tokens = {
  colors: {
    brand: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',  // Primary accent — CTAs, buttons, brand highlight
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    amber: {
      400: '#FBBF24',
      500: '#F59E0B',  // Secondary accent — heatmap peak, hover states
    },
    dark: {
      950: 'hsl(224, 71%, 4%)',   // Page background
      900: 'hsl(222, 47%, 11%)',  // Card/surface background
      800: 'hsl(223, 30%, 16%)',  // Elevated surface
      700: 'hsl(223, 22%, 22%)',  // Borders
    },
    success: '#10B981',   // Emerald — confirmations
    error: '#EF4444',     // Red — errors
    warning: '#F59E0B',   // Amber — warnings
    info: '#3B82F6',      // Blue — info (sparingly)
    text: {
      primary: 'hsl(210, 40%, 98%)',    // Near white
      secondary: 'hsl(215, 20%, 65%)',  // Gray
      muted: 'hsl(215, 15%, 45%)',      // Dimmed
    },
    heatmap: {
      empty: '#374151',     // No availability
      low: '#92400E',       // Low overlap
      medium: '#F59E0B',    // Medium overlap (amber)
      high: '#FB923C',      // High overlap (orange)
      full: '#F97316',      // Full overlap (coral/brand)
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    sizes: {
      hero: '3rem',        // 48px — H1 hero
      h1: '2.25rem',       // 36px
      h2: '1.875rem',      // 30px
      h3: '1.5rem',        // 24px
      h4: '1.25rem',       // 20px
      body: '1rem',        // 16px
      small: '0.875rem',   // 14px
      caption: '0.75rem',  // 12px
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    section: '5rem',      // Between major page sections
    card: '1.5rem',       // Card internal padding
    element: '1rem',      // Between elements
    tight: '0.5rem',      // Tight spacing
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  brand: {
    name: 'Find A Day',
    tagline: 'Find the best date for anything.',
    taglineAlt: 'Stop texting. Start planning.',
    email: 'hello@findaday.app',
    github: 'https://github.com/tomasleote/vacation-scheduler',
  },
};

export default tokens;
