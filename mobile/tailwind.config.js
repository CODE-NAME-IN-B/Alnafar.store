/** ثيم النفار المنقول من frontend/tailwind.config.js و styles.css */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#14b8a6',
          dark: '#0e7f74',
        },
        accent: '#8a5cff',
        base: '#0f1724',
        // سطح أعلى قليلا من الخلفية
        elevated: '#141e30',
        // سطح أعمق
        deep: '#0b1220',
        line: 'rgba(255,255,255,0.08)',
        text: '#f1f5f9',
        dim: '#94a3b8',
        faint: '#64748b',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};
