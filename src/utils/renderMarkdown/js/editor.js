/* editor.js - Simple syntax highlighting for markdown editor */
const editor = (function() {
  let textarea = null;
  let highlightEl = null;
  let isInitialized = false;
  let pendingChange = null;

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlightSyntax(text) {
    const lines = text.split('\n');
    let html = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let highlighted = processLine(line);
      html += highlighted + '\n';
    }

    return html || '<span class="hl-plain"></span>';
  }

  function processInlinePatterns(text) {
    const patterns = [
      { regex: /(\*\*\*[^*]+\*\*\*)/g, cls: 'hl-bold-italic' },
      { regex: /(\*\*[^*]+\*\*)/g, cls: 'hl-bold' },
      { regex: /(___[^_]+___)/g, cls: 'hl-bold-italic' },
      { regex: /(__[^_]+__)/g, cls: 'hl-bold' },
      { regex: /(\*[^*]+\*)/g, cls: 'hl-italic' },
      { regex: /(_[^_]+_)/g, cls: 'hl-italic' },
      { regex: /(~~[^~]+~~)/g, cls: 'hl-strikethrough' },
      { regex: /(`[^`]+`)/g, cls: 'hl-inline-code' },
      { regex: /(\[[^\]]+\]\([^)]+\))/g, cls: 'hl-link' },
      { regex: /(!\[[^\]]*\]\([^)]+\))/g, cls: 'hl-image' },
      { regex: /(<\/?[\w-]+)/g, cls: 'hl-html-tag' },
      { regex: /(\s[\w-]+=)/g, cls: 'hl-html-attr' },
      { regex: /("[^"]*")/g, cls: 'hl-html-value' },
    ];

    let allMatches = [];
    for (const p of patterns) {
      let match;
      const regex = new RegExp(p.regex.source, 'g');
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          cls: p.cls
        });
      }
    }

    allMatches.sort((a, b) => a.start - b.start);

    let kept = [];
    for (let i = 0; i < allMatches.length; i++) {
      if (kept.length === 0 || allMatches[i].start >= kept[kept.length - 1].end) {
        kept.push(allMatches[i]);
      }
    }
    allMatches = kept;

    let result = '';
    let lastIndex = 0;
    for (const m of allMatches) {
      if (m.start > lastIndex) {
        result += `<span class="hl-plain">${escapeHtml(text.slice(lastIndex, m.start))}</span>`;
      }
      result += `<span class="${m.cls}">${escapeHtml(m.text)}</span>`;
      lastIndex = m.end;
    }

    if (lastIndex < text.length) {
      result += `<span class="hl-plain">${escapeHtml(text.slice(lastIndex))}</span>`;
    }

    return result || escapeHtml(text);
  }

  function processLine(line) {
    if (/^\s*$/.test(line)) {
      return '<span class="hl-plain"> </span>';
    }

    let wrapperCls = null;
    let content = line;

    const headingMatch = line.match(/^(#{1,6}\s.*)$/);
    if (headingMatch) { wrapperCls = 'hl-heading'; content = headingMatch[1]; }

    if (!wrapperCls) {
      const codeFenceMatch = line.match(/^(```\w*)$/);
      if (codeFenceMatch) { wrapperCls = 'hl-code-fence'; content = codeFenceMatch[1]; }
    }

    if (!wrapperCls) {
      const hrMatch = line.match(/^(\s*[-*_]{3,}\s*)$/);
      if (hrMatch) { wrapperCls = 'hl-hr'; content = hrMatch[1]; }
    }

    if (!wrapperCls) {
      const quoteMatch = line.match(/^(\s*>\s.*)$/);
      if (quoteMatch) { wrapperCls = 'hl-quote'; content = quoteMatch[1]; }
    }

    if (!wrapperCls) {
      const listMatch = line.match(/^(\s*[-*+]\s.*)$/);
      if (listMatch) { wrapperCls = 'hl-list'; content = listMatch[1]; }
    }

    if (!wrapperCls) {
      const numListMatch = line.match(/^(\s*\d+\.\s.*)$/);
      if (numListMatch) { wrapperCls = 'hl-list'; content = numListMatch[1]; }
    }

    if (wrapperCls) {
      return `<span class="${wrapperCls}">${processInlinePatterns(content)}</span>`;
    }

    return processInlinePatterns(line);
  }

  function handleInput() {
    if (!textarea || !highlightEl) return;
    
    const text = textarea.value;
    highlightEl.innerHTML = highlightSyntax(text);

    // Debounce change callback
    if (pendingChange) clearTimeout(pendingChange);
    pendingChange = setTimeout(() => {
      if (window.editorOnChange) {
        window.editorOnChange(text);
      }
    }, 50);
  }

  function handleScroll() {
    if (!textarea || !highlightEl) return;
    highlightEl.scrollTop = textarea.scrollTop;
    highlightEl.scrollLeft = textarea.scrollLeft;
  }

  function initEditor(textareaId, highlightId, initialText) {
    if (isInitialized) return;

    textarea = document.getElementById(textareaId);
    highlightEl = document.getElementById(highlightId);
    
    if (!textarea) {
      console.error('Editor textarea not found:', textareaId);
      return;
    }
    if (!highlightEl) {
      console.error('Editor highlight not found:', highlightId);
      return;
    }

    isInitialized = true;

    textarea.value = initialText || '';
    handleInput();

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('scroll', handleScroll);

    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        handleInput();
      }
    });
  }

  function getValue() {
    return textarea ? textarea.value : '';
  }

  function setValue(text) {
    if (textarea) {
      textarea.value = text;
      handleInput();
    }
  }

  function refresh() {
    handleInput();
  }

  function syncScroll() {
    handleScroll();
  }

  return {
    initEditor,
    getValue,
    setValue,
    refresh,
    syncScroll
  };
})();