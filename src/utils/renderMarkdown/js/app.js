;(function() {
  'use strict';

  var STORAGE_KEY = 'renderMarkdown-content';

  var App = {
    currentTheme: 'nightSyscall',
    mobileView: 'preview',

    init: async function() {
      this.currentTheme = theme.initTheme();
      this.updateThemeIcon();

      await parser.initParser();
      editor.initEditor('markdownInput', 'editorHighlight', '');

      window.editorOnChange = function() {
        App.saveContent();
        App.renderAll();
      };

      this.loadContent();
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

    saveContent: function() {
      try { localStorage.setItem(STORAGE_KEY, editor.getValue()); } catch (_) {}
    },

    loadContent: function() {
      var saved;
      try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
      if (saved) {
        editor.setValue(saved);
        App.renderAll();
        return;
      }
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
        App.saveContent();
        App.renderAll();
        App.closeMenu();
      };
      reader.readAsText(file);
    },

    exportStyles: function() {
      var c = theme.getThemeColors(this.currentTheme);
      return '<style>' +
        '*{box-sizing:border-box;margin:0;padding:0}' +
        'body{font-family:system-ui,-apple-system,sans-serif;background:' + c.bg + ';color:' + c.textPrimary + ';padding:40px;max-width:800px;margin:0 auto;line-height:1.75;font-size:15px}' +
        '@media print{body{padding:15mm}}' +
        'h1{font-size:1.7em;font-weight:700;margin:1.8em 0 .4em;letter-spacing:-.02em}' +
        'h2{font-size:1.4em;font-weight:700;margin:1.8em 0 .4em;border-bottom:1px solid ' + c.border + ';padding-bottom:.25em}' +
        'h3{font-size:1.2em;font-weight:700;margin:1.8em 0 .4em}' +
        'h4{font-size:1.05em;font-weight:700;margin:1.5em 0 .3em;color:' + c.textSecondary + '}' +
        'p{margin:.8em 0}' +
        'strong{color:' + c.textPrimary + '}' +
        'em{color:' + c.textSecondary + '}' +
        'a{color:' + c.kwd + ';text-decoration:none}' +
        'a:hover{text-decoration:underline}' +
        'code{background:color-mix(in srgb,' + c.kwd + ' 10%,' + c.surface + ');color:' + c.fnc + ';padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.88em}' +
        'pre{background:' + c.surface + ';border:1px solid ' + c.border + ';border-radius:8px;padding:16px 18px;overflow-x:auto;margin:1em 0}' +
        'pre code{background:none;padding:0;border:none;color:' + c.textPrimary + ';font-size:.85em;line-height:1.55}' +
        'blockquote{border-left:3px solid ' + c.kwd + ';background:color-mix(in srgb,' + c.kwd + ' 4%,' + c.surface + ');padding:10px 16px;margin:1em 0;color:' + c.textSecondary + ';border-radius:0 6px 6px 0}' +
        'blockquote p{margin:.4em 0}' +
        'ul,ol{padding-left:22px;margin:.6em 0}' +
        'li{margin:.3em 0}' +
        'ul li::marker{color:' + c.kwd + '}' +
        'ol li::marker{color:' + c.num + ';font-weight:600}' +
        'table{width:auto;min-width:50%;max-width:100%;border-collapse:collapse;margin:1em 0;font-size:.9em;border:1px solid ' + c.border + ';border-radius:8px;overflow:hidden}' +
        'th{background:' + c.surface + ';color:' + c.textPrimary + ';font-weight:600;text-align:left;padding:8px 14px;border:1px solid ' + c.border + '}' +
        'td{padding:7px 14px;border:1px solid ' + c.border + '}' +
        'tr:nth-child(even){background:color-mix(in srgb,' + c.surface + ' 50%,' + c.bg + ')}' +
        'hr{border:none;border-top:1px solid ' + c.border + ';margin:2em 0}' +
        'img{max-width:100%;border-radius:6px}' +
        '.katex-display{background:' + c.surface + ';padding:14px;border-radius:8px;margin:1em 0;overflow-x:auto}' +
        '.katex{color:' + c.textPrimary + '}' +
        /* Prism tokens */
        '.token.comment,.token.prolog,.token.doctype,.token.cdata{color:' + c.textMuted + ';font-style:italic}' +
        '.token.punctuation{color:' + c.textSecondary + '}' +
        '.token.property,.token.tag,.token.boolean,.token.number,.token.constant,.token.symbol,.token.deleted{color:' + c.num + '}' +
        '.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.inserted{color:' + c.str + '}' +
        '.token.operator,.token.entity,.token.url,.token.variable{color:' + c.opr + '}' +
        '.token.atrule,.token.attr-value,.token.keyword{color:' + c.kwd + '}' +
        '.token.function,.token.class-name{color:' + c.fnc + '}' +
        '.token.regex,.token.important{color:' + c.num + '}' +
        '.token.bold{font-weight:bold}' +
        '.token.italic{font-style:italic}' +
        '</style>'
    },

    exportAsPdf: function() {
      if (window.Prism) Prism.highlightAllUnder(document.getElementById('previewOutput'));
      var preview = document.getElementById('previewOutput').cloneNode(true);
      var pw = window.open('', '_blank');
      pw.document.write('<!DOCTYPE html>' +
        '<html><head><title>Markdown Export</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">' +
        this.exportStyles() +
        '</head><body>' + preview.innerHTML + '</body></html>');
      pw.document.close();
      setTimeout(function() { pw.print(); }, 500);
      this.closeMenu();
    },

    exportAsHtml: function() {
      if (window.Prism) Prism.highlightAllUnder(document.getElementById('previewOutput'));
      var html = document.getElementById('previewOutput').innerHTML;
      var content = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Markdown Export</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">' +
        this.exportStyles() +
        '</head><body>' + html + '</body></html>';
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
