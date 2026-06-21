// theme.js - Theme switching module
// Exports: setTheme, getCurrentTheme, themeData

const themeData = {
  nightSyscall: {
    name: 'Night',
    colors: {
      bg: "#161423",
      surface: "#201D33",
      border: "#322D4A",
      textPrimary: "#E0DEF4",
      textSecondary: "#908CAA",
      textMuted: "#6E6A86",
      kwd: "#A277FF",
      fnc: "#FF3366",
      typ: "#CBA6F7",
      str: "#F087BD",
      num: "#F6C177",
      opr: "#80FFEA"
    }
  },
  daySyscall: {
    name: 'Day',
    colors: {
      bg: "#FCF0E0",
      surface: "#F5E8D8",
      border: "#E0D0C0",
      textPrimary: "#201820",
      textSecondary: "#584870",
      textMuted: "#A888A8",
      kwd: "#8040E0",
      fnc: "#D03060",
      typ: "#9060D0",
      str: "#C06080",
      num: "#C08830",
      opr: "#30A890"
    }
  }
};

let currentTheme = 'nightSyscall';

function getCurrentTheme() {
  return currentTheme;
}

function setTheme(theme) {
  try {
    if (!themeData[theme]) {
      console.warn('Unknown theme:', theme);
      theme = 'nightSyscall';
    }
    
    currentTheme = theme;
    const root = document.documentElement;
    const colors = themeData[theme].colors;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Update data-theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save preference
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage not available
    }
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme, colors } }));
    
    return true;
  } catch (e) {
    console.error('Error setting theme:', e);
    return false;
  }
}

function initTheme() {
  try {
    // Check localStorage
    const saved = localStorage.getItem('theme');
    const initialTheme = (saved && themeData[saved]) ? saved : 'nightSyscall';
    setTheme(initialTheme);
    return initialTheme;
  } catch (e) {
    setTheme('nightSyscall');
    return 'nightSyscall';
  }
}

function getThemeColors(theme = currentTheme) {
  return themeData[theme]?.colors || themeData.nightSyscall.colors;
}

function getThemeIcon(theme) {
  const isNight = theme === 'nightSyscall';
  return isNight
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="#45383C" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { themeData, setTheme, getCurrentTheme, initTheme, getThemeColors, getThemeIcon };
}

// Make globally available
window.theme = { themeData, setTheme, getCurrentTheme, initTheme, getThemeColors, getThemeIcon };