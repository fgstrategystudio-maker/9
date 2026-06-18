export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Vitae brand — Palette 01 (Blu chiaro + Oro).
        // `blue` is remapped to the Vitae primary so existing blue-* utilities
        // (buttons, links, focus rings) read as brand.
        blue: {
          50:  '#EAF2FA',
          100: '#D8E8F6',
          200: '#BAD6EE',
          300: '#8FBEE2',
          400: '#4FA6DD', // accent
          500: '#4297D6',
          600: '#3E86C8', // primary
          700: '#356FA8', // primary hover
          800: '#2C597F',
          900: '#15314A', // navy
        },
        vitae: {
          primary: '#3E86C8',
          accent:  '#4FA6DD',
          gold:    '#C8A24A',
          'gold-soft': '#E0C887',
          navy:    '#15314A',
          deep:    '#0E1626',
          bg:      '#F4F1EA',
          surface: '#FFFFFF',
          ink:     '#1B2A3D',
          muted:   '#6E7E92',
          hair:    '#E6E2D8',
        },
      },
      fontFamily: {
        sans:  ['Schibsted Grotesk', 'system-ui', 'sans-serif'],
        serif: ['Spectral', 'Georgia', 'serif'],
        mono:  ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
