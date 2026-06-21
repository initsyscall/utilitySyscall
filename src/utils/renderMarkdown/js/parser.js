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

function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<link\b[^>]*\/?>/gi, '')
    .replace(/<meta\b[^>]*\/?>/gi, '')
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '');
}

function htmlToCallouts(html) {
  return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, function(m, inner) {
    var m2 = inner.match(/^\s*<p>\[!(\w+)\]\s*(.*?)<\/p>\s*([\s\S]*)$/i);
    if (!m2) return m;
    var type = m2[1].toLowerCase();
    var firstContent = m2[2];
    var restContent = m2[3];
    return '<div class="callout callout-' + type + '">' +
      '<div class="callout-title">' + m2[1] + '</div>' +
      '<div class="callout-content">' +
      (firstContent ? '<p>' + firstContent + '</p>' : '') +
      restContent +
      '</div></div>';
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
      
      // Sanitize XSS from raw HTML passthrough
      html = sanitizeHtml(html);
      
      // Convert Obsidian callouts
      html = htmlToCallouts(html);
      
      // Convert mermaid code blocks to diagram containers
      html = html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid">$1</div>');
      
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
  var html = text;

  // Blockquotes and callouts (before HTML escaping — raw > is still present)
  var bqMap = [];
  html = html.replace(/((?:^> .+(?:\n|$))+)/gm, function(match) {
    var idx = bqMap.length;
    var lines = match.trim().split('\n');
    var contentLines = lines.map(function(l) { return l.replace(/^> /, ''); });
    var content = contentLines.join('\n');

    var cMatch = content.match(/^\[!(\w+)\]\s*(.*)$/i);
    if (cMatch) {
      var type = cMatch[1].toLowerCase();
      var title = cMatch[1];
      var inlineContent = cMatch[2].trim();
      var restLines = contentLines.slice(1).join('\n').trim();
      var body = inlineContent
        ? (restLines ? inlineContent + '\n' + restLines : inlineContent)
        : restLines;
      bqMap.push('<div class="callout callout-' + type + '"><div class="callout-title">' +
        title + '</div><div class="callout-content">' + body + '</div></div>');
    } else {
      bqMap.push('<blockquote>' + content + '</blockquote>');
    }
    return '##BQ' + idx + '##';
  });

  // Escape HTML (##BQ0## placeholders survive — no <>& in them)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Restore blockquotes/callouts
  html = html.replace(/##BQ(\d+)##/g, function(m, idx) { return bqMap[parseInt(idx)]; });

  // Mermaid diagrams (must come before general code blocks)
  html = html.replace(/```mermaid\n?([\s\S]*?)```/g, '<div class="mermaid">$1</div>');

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

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Lists - block-level wrapping
  html = html.replace(/^- (.+)$/gm, '<!--ul--><li>$1</li>');
  html = html.replace(/((?:<!--ul--><li>[\s\S]*?<\/li>(?:\n|$))+)/g, function(m) {
    return '<ul>\n' + m.replace(/<!--ul-->/g, '') + '</ul>';
  });

  html = html.replace(/^\d+\. (.+)$/gm, '<!--ol--><li>$1</li>');
  html = html.replace(/((?:<!--ol--><li>[\s\S]*?<\/li>(?:\n|$))+)/g, function(m) {
    return '<ol>\n' + m.replace(/<!--ol-->/g, '') + '</ol>';
  });

  // Paragraphs
  html = html.split('\n\n').map(function(para) {
    var t = para.trim();
    if (t.startsWith('<h') || t.startsWith('<ul') || t.startsWith('<ol') ||
        t.startsWith('<blockquote') || t.startsWith('<pre') || t.startsWith('<hr') ||
        t.startsWith('<div') || t.startsWith('<li')) {
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