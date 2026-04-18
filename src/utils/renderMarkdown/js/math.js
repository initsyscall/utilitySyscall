// katex.js - Math rendering module with KaTeX
// Exports: renderMath, initKatex, isKatexReady

let katexReady = false;
let katexLoading = false;

function isKatexReady() {
  return katexReady && typeof window.renderMathInElement === 'function';
}

function renderMathInline(element) {
  if (!isKatexReady()) return false;
  
  try {
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      errorColor: 'var(--fnc)'
    });
    return true;
  } catch (e) {
    console.error('KaTeX render error:', e);
    return false;
  }
}

function renderMathDisplay(element) {
  if (!isKatexReady()) return false;
  
  try {
    // Handle display math blocks
    const displayMath = element.querySelectorAll('.katex-display[data-math]');
    displayMath.forEach(el => {
      const math = el.getAttribute('data-math');
      try {
        el.innerHTML = katex.renderToString(math, {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
      } catch (e) {
        el.innerHTML = `<code class="katex-error">${math}</code>`;
      }
    });
    
    // Handle inline math
    const inlineMath = element.querySelectorAll('.katex-inline[data-math]');
    inlineMath.forEach(el => {
      const math = el.getAttribute('data-math');
      try {
        el.innerHTML = katex.renderToString(math, {
          displayMode: false,
          throwOnError: false,
          output: 'html'
        });
      } catch (e) {
        el.innerHTML = `<code class="katex-error">${math}</code>`;
      }
    });
    
    return true;
  } catch (e) {
    console.error('Display math render error:', e);
    return false;
  }
}

function renderMath(element) {
  // Try both methods - graceful fallback
  if (!renderMathDisplay(element)) {
    // If KaTeX not ready, keep original $...$ and $$...$$
    console.log('KaTeX not available, math will render as plain text');
  }
  renderMathInline(element);
}

function initKatex() {
  return new Promise((resolve, reject) => {
    if (katexReady) {
      resolve(true);
      return;
    }
    
    if (katexLoading) {
      // Already loading, wait for it
      const checkReady = setInterval(() => {
        if (katexReady) {
          clearInterval(checkReady);
          resolve(true);
        }
      }, 100);
      return;
    }
    
    katexLoading = true;
    
    // Load KaTeX CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(link);
    
    // Load KaTeX JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.async = true;
    
    script.onload = () => {
      // Load auto-render extension
      const autoRender = document.createElement('script');
      autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
      autoRender.async = true;
      
      autoRender.onload = () => {
        katexReady = true;
        katexLoading = false;
        console.log('KaTeX initialized');
        resolve(true);
      };
      
      autoRender.onerror = () => {
        katexLoading = false;
        console.warn('KaTeX auto-render failed to load');
        resolve(false);
      };
      
      document.head.appendChild(autoRender);
    };
    
    script.onerror = () => {
      katexLoading = false;
      console.warn('KaTeX failed to load');
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
}

function processMathInElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    renderMath(element);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderMath, initKatex, isKatexReady, processMathInElement };
}

// Make globally available
window.math = { renderMath, initKatex, isKatexReady, processMathInElement };