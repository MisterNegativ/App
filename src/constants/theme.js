// src/constants/theme.js
const theme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    success: '#27ae60',
    white: '#ffffff',
    lightGray: '#ecf0f1',
    gray: '#bdc3c7',
    darkGray: '#7f8c8d',
    black: '#2c3e50',
    background: '#f5f7fa',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  text: {
    h1: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 20,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
    },
  },
};

// Экспортируем как именованную и default константу
export { theme };
export default theme;