// parser.js - Simple Markdown to HTML parser
// Uses marked.js library for reliable parsing

// If marked is available, use it. Otherwise use simple fallback.
let markedReady = false;
let markedLib = null;

function loadMarked() {
  return new Promise((resolve) => {
    if (window.marked) {
      markedLib = window.marked;
      markedReady = true;
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.async = true;
    script.onload = () => {
      markedLib = window.marked;
      markedReady = true;
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

function parseMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Use marked library if available
  if (markedReady && markedLib) {
    try {
      // Configure marked
      markedLib.setOptions({
        breaks: true,
        gfm: true
      });
      
      let html = markedLib.parse(text);
      
      // Post-process to add data attributes for KaTeX
      html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
        return `<div class="katex-display" data-math="${escapeAttr(math.trim())}"></div>`;
      });
      
      html = html.replace(/\$([^$\n]+)\$/g, (match, math) => {
        return `<span class="katex-inline" data-math="${escapeAttr(math.trim())}"></span>`;
      });
      
      return html;
    } catch (e) {
      console.error('Marked parse error:', e);
    }
  }

  // Fallback: simple regex-based parser
  return simpleParse(text);
}

function simpleParse(text) {
  let html = text;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="language-$1"><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Math blocks
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="katex-display" data-math="$1"></div>');
  html = html.replace(/\$([^$\n]+)\$/g, '<span class="katex-inline" data-math="$1"></span>');

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Lists - simple approach
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>');
  
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.trim().startsWith('<h') || para.trim().startsWith('<ul') || 
        para.trim().startsWith('<ol') || para.trim().startsWith('<blockquote') ||
        para.trim().startsWith('<pre') || para.trim().startsWith('<hr') ||
        para.trim().startsWith('<div') || para.trim().startsWith('<li')) {
      return para;
    }
    return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
  }).join('\n');

  return html;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function initParser() {
  await loadMarked();
  console.log('Parser ready, marked:', markedReady);
}

function renderPreview(inputId, outputId) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  
  if (!input || !output) return false;
  
  const html = parseMarkdown(input.value || input.innerText);
  output.innerHTML = html;
  
  // Trigger Prism highlighting
  setTimeout(() => {
    if (window.Prism) {
      Prism.highlightAllUnder(output);
    }
  }, 10);
  
  return true;
}

function renderFromText(text, outputId) {
  const output = document.getElementById(outputId);
  
  if (!output) return false;
  
  const html = parseMarkdown(text);
  output.innerHTML = html;
  
  // Trigger Prism highlighting
  setTimeout(() => {
    if (window.Prism) {
      Prism.highlightAllUnder(output);
    }
  }, 10);
  
  return true;
}

// Export
window.parser = { parseMarkdown, renderPreview, renderFromText, initParser };