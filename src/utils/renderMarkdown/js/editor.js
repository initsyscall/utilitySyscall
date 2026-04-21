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

  function processLine(line) {
    // Empty line
    if (/^\s*$/.test(line)) {
      return '<span class="hl-plain"> </span>';
    }

    // Heading - entire line colored
    const headingMatch = line.match(/^(#{1,6}\s.*)$/);
    if (headingMatch) {
      return `<span class="hl-heading">${escapeHtml(headingMatch[1])}</span>`;
    }

    // Code fence ```
    const codeFenceMatch = line.match(/^(```\w*)$/);
    if (codeFenceMatch) {
      return `<span class="hl-code-fence">${escapeHtml(codeFenceMatch[1])}</span>`;
    }

    // Horizontal rule ---
    const hrMatch = line.match(/^(\s*[-*_]{3,}\s*)$/);
    if (hrMatch) {
      return `<span class="hl-hr">${escapeHtml(hrMatch[1])}</span>`;
    }

    // Blockquote > - entire line gray
    const quoteMatch = line.match(/^(\s*&gt;\s.*)$/);
    if (quoteMatch) {
      return `<span class="hl-quote">${escapeHtml(quoteMatch[1])}</span>`;
    }

    // Unordered list - entire line purple
    const listMatch = line.match(/^(\s*[-*+]\s.*)$/);
    if (listMatch) {
      return `<span class="hl-list">${escapeHtml(listMatch[1])}</span>`;
    }

    // Ordered list - entire line purple
    const numListMatch = line.match(/^(\s*\d+\.\s.*)$/);
    if (numListMatch) {
      return `<span class="hl-list">${escapeHtml(numListMatch[1])}</span>`;
    }

    // Inline patterns - process each match
    let result = '';
    let remaining = line;
    let lastIndex = 0;

    // Combined regex for inline elements
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
      { regex: /(&lt;\/?[\w-]+)/g, cls: 'hl-html-tag' },
      { regex: /(\s[\w-]+=)/g, cls: 'hl-html-attr' },
      { regex: /("[^"]*")/g, cls: 'hl-html-value' },
    ];

    // Find all matches with their positions
    let allMatches = [];
    for (const p of patterns) {
      let match;
      const regex = new RegExp(p.regex.source, 'g');
      while ((match = regex.exec(line)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          cls: p.cls
        });
      }
    }

    // Sort by position and filter overlaps
    allMatches.sort((a, b) => a.start - b.start);
    allMatches = allMatches.filter((m, i) => {
      if (i === 0) return true;
      return m.start >= allMatches[i - 1].end;
    });

    // Build result
    lastIndex = 0;
    for (const m of allMatches) {
      if (m.start > lastIndex) {
        result += `<span class="hl-plain">${escapeHtml(line.slice(lastIndex, m.start))}</span>`;
      }
      result += `<span class="${m.cls}">${escapeHtml(m.text)}</span>`;
      lastIndex = m.end;
    }

    if (lastIndex < line.length) {
      result += `<span class="hl-plain">${escapeHtml(line.slice(lastIndex))}</span>`;
    }

    return result || `<span class="hl-plain">${escapeHtml(line)}</span>`;
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
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
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