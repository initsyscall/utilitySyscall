// mermaid.js - Mermaid diagram rendering with themeInit palette
(function() {
  'use strict';

  var ready = false;
  var loading = false;

  function readVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
  }

  function v(name, fallback) { var x = readVar(name); return x || fallback; }

  function getThemeVars() {
    return {
      background: v('bg'),
      mainBkg: v('surface'),
      nodeBorder: v('border'),
      nodeTextColor: v('textPrimary'),
      lineColor: v('border'),
      clusterBkg: v('surface'),
      clusterBorder: v('border'),
      titleColor: v('textPrimary'),
      primaryColor: v('kwd'),
      primaryTextColor: v('textPrimary'),
      primaryBorderColor: v('border'),
      secondaryColor: v('fnc'),
      tertiaryColor: v('typ'),
      tertiaryTextColor: v('textSecondary'),
      secondaryTextColor: v('textSecondary'),
      errorBkgColor: v('fnc') + '22',
      errorTextColor: v('fnc'),
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
    };
  }

  function init() {
    return new Promise(function(resolve) {
      if (ready) { resolve(true); return; }
      if (loading) {
        var check = setInterval(function() {
          if (ready) { clearInterval(check); resolve(true); }
        }, 100);
        return;
      }

      loading = true;

      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.2.0/dist/mermaid.min.js';
      script.async = true;

      script.onload = function() {
        window.mermaid.initialize({
          theme: 'base',
          themeVariables: getThemeVars(),
          startOnLoad: false,
          securityLevel: 'loose',
        });
        ready = true;
        loading = false;
        resolve(true);
      };

      script.onerror = function() {
        loading = false;
        console.warn('Mermaid failed to load from CDN');
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }

  function render(element) {
    if (!ready || !window.mermaid) return;

    var containers = element.querySelectorAll('.mermaid');
    if (containers.length === 0) return;

    containers.forEach(function(el) {
      var source = el.getAttribute('data-mermaid-source');
      if (!source) {
        source = el.textContent.trim();
        el.setAttribute('data-mermaid-source', source);
      }
      if (!source) return;

      var id = 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

      try {
        window.mermaid.render(id, source).then(function(result) {
          el.innerHTML = result.svg;
        }).catch(function(err) {
          el.innerHTML = '<div class="mermaid-error"><span class="mermaid-error-icon">△</span> ' +
            escapeHtml(err.message || 'Parse error') + '</div>' +
            '<pre class="mermaid-fallback"><code>' + escapeHtml(source) + '</code></pre>';
        });
      } catch (e) {
        el.innerHTML = '<div class="mermaid-error"><span class="mermaid-error-icon">△</span> ' +
          escapeHtml(e.message || 'Render error') + '</div>' +
          '<pre class="mermaid-fallback"><code>' + escapeHtml(source) + '</code></pre>';
      }
    });
  }

  function updateTheme() {
    if (!ready || !window.mermaid) return;
    window.mermaid.initialize({
      theme: 'base',
      themeVariables: getThemeVars(),
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.mermaidModule = { init: init, render: render, updateTheme: updateTheme };
})();
