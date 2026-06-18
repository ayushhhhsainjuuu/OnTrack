import React, { useState, useEffect } from 'react';

export default function ThemeToggle() {
  // 1. Initialize state from localStorage or default to light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  // 2. Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // 3. Toggle helper function
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 4. Define dynamic inline style configurations
  const isDark = theme === 'dark';
  
  const containerStyle = {
    backgroundColor: isDark ? '#121212' : '#ffffff',
    color: isDark ? '#f5f5f5' : '#1a1a1a',
    minHeight: '100vh',
    padding: '40px',
    fontFamily: 'sans-serif',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  };

  const buttonStyle = {
    backgroundColor: isDark ? '#333333' : '#eeeeee',
    color: isDark ? '#ffffff' : '#000000',
    border: '1px solid ' + (isDark ? '#555555' : '#cccccc'),
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  };

  return (
    <div style={containerStyle}>
      <button style={buttonStyle} onClick={toggleTheme}>
        Switch to {isDark ? '☀️ Light' : '🌙 Dark'} Mode
      </button>
      <h1>Inline Style Theme Switcher</h1>
      <p>This implementation requires absolutely zero changes to external CSS files.</p>
    </div>
  );
}
