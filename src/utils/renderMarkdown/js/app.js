;(function() {
  'use strict';

  var App = {
    currentTheme: 'nightSyscall',
    mobileView: 'preview',

    init: async function() {
      this.currentTheme = theme.initTheme();
      this.updateThemeIcon();

      await parser.initParser();
      editor.initEditor('markdownInput', 'editorHighlight', '');

      window.editorOnChange = function() {
        App.renderAll();
      };

      this.loadDefaultMarkdown();
      this.setupEventListeners();
      this.initMobileView();

      math.initKatex().then(function() {
        App.renderAll();
      });

      this.renderAll();
    },

    updateThemeIcon: function() {
      var icon = theme.getThemeIcon(this.currentTheme);
      var el = document.querySelector('.theme-icon');
      if (el) {
        el.innerHTML = icon;
        el.className = 'theme-icon ' + (this.currentTheme === 'nightSyscall' ? 'night' : 'day');
      }
    },

    toggleTheme: function() {
      this.currentTheme = this.currentTheme === 'nightSyscall' ? 'daySyscall' : 'nightSyscall';
      theme.setTheme(this.currentTheme);
      this.updateThemeIcon();
    },

    toggleMobileView: function() {
      this.mobileView = this.mobileView === 'preview' ? 'editor' : 'preview';
      this.updateMobileView();
    },

    updateMobileView: function() {
      var editorPane = document.querySelector('.editor-pane');
      var previewPane = document.querySelector('.preview-pane');
      var iconPreview = document.querySelector('.icon-preview');
      var iconEditor = document.querySelector('.icon-editor');
      var isPreview = this.mobileView === 'preview';

      if (editorPane) editorPane.classList.toggle('active', !isPreview);
      if (previewPane) previewPane.classList.toggle('active', isPreview);
      if (iconPreview) iconPreview.style.display = isPreview ? 'none' : 'block';
      if (iconEditor) iconEditor.style.display = isPreview ? 'block' : 'none';
    },

    initMobileView: function() {
      if (window.innerWidth < 768) {
        this.mobileView = 'preview';
        this.updateMobileView();
      }
    },

    renderAll: function() {
      var text = editor.getValue();
      parser.renderFromText(text, 'previewOutput');
      setTimeout(function() {
        if (window.Prism) Prism.highlightAllUnder(document.getElementById('previewOutput'));
        math.processMathInElement('previewOutput');
      }, 50);
    },

    loadDefaultMarkdown: function() {
      fetch('default.md')
        .then(function(r) { return r.text(); })
        .then(function(text) {
          editor.setValue(text);
          App.renderAll();
        })
        .catch(function() {});
    },

    importFile: function() {
      document.getElementById('fileInput').click();
    },

    handleFileImport: function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        editor.setValue(e.target.result);
        App.renderAll();
        App.closeMenu();
      };
      reader.readAsText(file);
    },

    exportAsPdf: function() {
      if (window.Prism) Prism.highlightAllUnder(document.getElementById('previewOutput'));
      var preview = document.getElementById('previewOutput').cloneNode(true);
      var printColors = {
        bg: '#ffffff', surface: '#f5f5f5', border: '#dddddd',
        textPrimary: '#1a1a1a', textSecondary: '#555555', textMuted: '#888888',
        kwd: '#752D7A', fnc: '#D62846', typ: '#9E4081',
        str: '#D96677', num: '#B06A3B', opr: '#0F828A'
      };
      var pw = window.open('', '_blank');
      pw.document.write('<!DOCTYPE html><html><head><title>Markdown Export</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">' +
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">' +
        '<style>*{box-sizing:border-box;margin:0;padding:0}@media print{body{padding:0!important}}' +
        'body{font-family:Segoe UI,system-ui,sans-serif;background:' + printColors.bg + ';color:' + printColors.textPrimary + ';padding:15mm;max-width:100%;margin:0 auto;line-height:1.5;overflow-x:hidden}' +
        'h1{font-size:1.8em;border-bottom:2px solid ' + printColors.kwd + ';padding-bottom:0.3em;color:' + printColors.textPrimary + ';margin:0 0 .5em}' +
        'h2{font-size:1.4em;border-left:4px solid ' + printColors.typ + ';padding-left:12px;color:' + printColors.textPrimary + ';margin:1.5em 0 .5em}' +
        'h3{font-size:1.2em;color:' + printColors.fnc + '}h4{color:' + printColors.str + '}' +
        'p{margin:.8em 0}code{background:' + printColors.surface + ';color:' + printColors.fnc + ';padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.9em}' +
        'pre{background:' + printColors.surface + ';padding:12px;border-radius:8px;overflow-x:auto;margin:.8em 0}' +
        'pre code{background:none;padding:0;color:' + printColors.textPrimary + ';font-size:.85em;line-height:1.5}' +
        'blockquote{border-left:4px solid ' + printColors.kwd + ';background:' + printColors.surface + ';padding:10px 16px;color:' + printColors.textSecondary + ';border-radius:0 8px 8px 0;margin:.8em 0}' +
        'ul,ol{padding-left:20px;margin:.8em 0}li{margin:.3em 0}a{color:' + printColors.kwd + '}' +
        'table{width:auto;max-width:100%;min-width:50%;border-collapse:collapse;margin:.8em 0;border:1px solid ' + printColors.border + ';font-size:.85em}' +
        'th,td{border:1px solid ' + printColors.border + ';padding:6px 12px;text-align:left;min-width:80px}' +
        'th{background:' + printColors.surface + ';color:' + printColors.kwd + ';font-weight:600}' +
        'tr:nth-child(even){background:' + printColors.surface + '}' +
        'hr{border:none;border-top:2px dashed ' + printColors.border + ';margin:1.5em 0}' +
        'img{max-width:100%;height:auto}' +
        '.katex-display{background:' + printColors.surface + ';padding:12px;border-radius:8px;margin:.8em 0;overflow-x:auto}' +
        '.token.comment{color:' + printColors.textMuted + ';font-style:italic}' +
        '.token.keyword{color:' + printColors.kwd + '}' +
        '.token.string{color:' + printColors.str + '}' +
        '.token.number{color:' + printColors.num + '}' +
        '.token.function{color:' + printColors.fnc + '}' +
        '.token.operator{color:' + printColors.opr + '}' +
        '.token.class-name{color:' + printColors.typ + '}' +
        '.token.punctuation{color:' + printColors.textSecondary + '}' +
        '.token.property{color:' + printColors.num + '}' +
        '.token.boolean{color:' + printColors.num + '}' +
        '.token.attr-name{color:' + printColors.kwd + '}' +
        '.token.attr-value{color:' + printColors.str + '}' +
        '.token.selector{color:' + printColors.kwd + '}' +
        '.token.tag{color:' + printColors.fnc + '}' +
        '.token.atrule{color:' + printColors.kwd + '}' +
        '.tokenbuiltin{color:' + printColors.fnc + '}' +
        '</style></head><body>' + preview.innerHTML + '</body></html>');
      pw.document.close();
      setTimeout(function() { pw.print(); }, 500);
      this.closeMenu();
    },

    exportAsHtml: function() {
      var colors = theme.getThemeColors(this.currentTheme);
      if (window.Prism) Prism.highlightAllUnder(document.getElementById('previewOutput'));
      var html = document.getElementById('previewOutput').innerHTML;
      var content = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Markdown Export</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">' +
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">' +
        '<style>:root{--bg:' + colors.bg + ';--surface:' + colors.surface + ';--border:' + colors.border + ';--textPrimary:' + colors.textPrimary + ';--textSecondary:' + colors.textSecondary + ';--textMuted:' + colors.textMuted + ';--kwd:' + colors.kwd + ';--fnc:' + colors.fnc + ';--typ:' + colors.typ + ';--str:' + colors.str + ';--num:' + colors.num + ';--opr:' + colors.opr + '}' +
        '*{box-sizing:border-box}body{font-family:Segoe UI,system-ui,sans-serif;background:var(--bg);color:var(--textPrimary);padding:40px;max-width:800px;margin:0 auto;line-height:1.6}' +
        'h1{font-size:2em;border-bottom:2px solid var(--kwd);padding-bottom:.3em}h2{font-size:1.5em;border-left:4px solid var(--typ);padding-left:12px}h3{font-size:1.25em;color:var(--fnc)}' +
        'p{margin:1em 0}code{background:var(--surface);color:var(--fnc);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.9em}' +
        'pre{background:var(--surface);padding:16px;border-radius:8px;overflow-x:auto;margin:1em 0}pre code{background:none;padding:0;color:var(--textPrimary)}' +
        'blockquote{border-left:4px solid var(--kwd);background:var(--surface);padding:12px 16px;color:var(--textSecondary);border-radius:0 8px 8px 0}' +
        'ul,ol{padding-left:24px}a{color:var(--kwd)}table{width:100%;border-collapse:collapse;margin:1em 0}' +
        'th,td{border:1px solid var(--border);padding:10px}th{background:var(--surface);color:var(--kwd)}' +
        '.token.comment{color:var(--textMuted)}.token.keyword{color:var(--kwd)}.token.string{color:var(--str)}.token.number{color:var(--num)}.token.function{color:var(--fnc)}.token.operator{color:var(--opr)}.token.class-name{color:var(--typ)}.token.punctuation{color:var(--textSecondary)}' +
        '</style></head><body>' + html + '</body></html>';
      var blob = new Blob([content], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'markdown-export.html';
      a.click();
      URL.revokeObjectURL(url);
      this.closeMenu();
    },

    toggleMenu: function() {
      document.getElementById('hamburger').classList.toggle('active');
      document.getElementById('menuDropdown').classList.toggle('active');
    },

    closeMenu: function() {
      document.getElementById('hamburger').classList.remove('active');
      document.getElementById('menuDropdown').classList.remove('active');
    },

    setupEventListeners: function() {
      document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));
      document.getElementById('logoToggle').addEventListener('click', this.toggleMobileView.bind(this));
      document.getElementById('viewToggle').addEventListener('click', this.toggleMobileView.bind(this));
      document.getElementById('hamburger').addEventListener('click', this.toggleMenu.bind(this));
      document.getElementById('importBtn').addEventListener('click', this.importFile.bind(this));
      document.getElementById('exportPdfBtn').addEventListener('click', this.exportAsPdf.bind(this));
      document.getElementById('exportHtmlBtn').addEventListener('click', this.exportAsHtml.bind(this));
      document.getElementById('fileInput').addEventListener('change', function(e) {
        if (e.target.files[0]) App.handleFileImport(e.target.files[0]);
      });

      document.addEventListener('click', function(e) {
        if (!e.target.closest('.hamburger') && !e.target.closest('.menu-dropdown')) App.closeMenu();
      });

      window.addEventListener('themechange', this.renderAll.bind(this));
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    App.init().catch(function(err) { console.error('App init error:', err); });
  });
})();
