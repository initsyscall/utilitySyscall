;(function() {
  'use strict'

  var themeData = {
    nightSyscall: {
      colors: {
        bg: '#161423', surface: '#201D33', border: '#322D4A',
        textPrimary: '#E0DEF4', textSecondary: '#908CAA', textMuted: '#6E6A86',
        kwd: '#A277FF', fnc: '#FF3366', typ: '#CBA6F7',
        str: '#F087BD', num: '#F6C177', opr: '#80FFEA'
      }
    },
    daySyscall: {
      colors: {
        bg: '#FCF6F5', surface: '#F2EAE9', border: '#E0D1CF',
        textPrimary: '#45383C', textSecondary: '#827075', textMuted: '#A8959A',
        kwd: '#752D7A', fnc: '#D62846', typ: '#9E4081',
        str: '#D96677', num: '#B06A3B', opr: '#0F828A'
      }
    }
  }

  var currentTheme = 'nightSyscall'

  function setTheme(theme) {
    if (!themeData[theme]) theme = 'nightSyscall'
    currentTheme = theme
    var root = document.documentElement
    var colors = themeData[theme].colors
    Object.keys(colors).forEach(function(k) { root.style.setProperty('--' + k, colors[k]) })
    root.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch (_) {}

    var btn = document.getElementById('themeToggle')
    if (!btn) return
    var isNight = theme === 'nightSyscall'
    btn.innerHTML =
      '<div class="theme-icon">' +
      (isNight
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><g stroke="currentColor"><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g></svg>') +
      '</div>'
  }

  function esc(str) {
    var d = document.createElement('div')
    d.appendChild(document.createTextNode(str))
    return d.innerHTML
  }

  function renderCards(data) {
    var c = document.getElementById('cardsContainer')
    var n = document.getElementById('noResults')
    if (!c || !n) return
    if (!data.length) { c.innerHTML = ''; n.style.display = 'block'; return }
    n.style.display = 'none'
    c.innerHTML = data.map(function(item, i) {
      return '<article class="card" style="animation-delay:' + (0.08 + i * 0.06) + 's" onclick="window.location.href=\'' + item.filePath + '\'">' +
        '<h2 class="card-title">' + esc(item.heading) + '</h2>' +
        '<p class="card-description">' + esc(item.description) + '</p>' +
        '<div class="card-tags">' +
        item.tags.map(function(t) { return '<span class="tag">' + esc(t) + '</span>' }).join('') +
        '</div></article>'
    }).join('')
  }

  function filter(q) {
    q = q.toLowerCase().trim()
    if (!q) { renderCards(window.__utils); return }
    var f = window.__utils.filter(function(item) {
      return item.heading.toLowerCase().indexOf(q) !== -1 ||
        item.description.toLowerCase().indexOf(q) !== -1 ||
        item.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1 })
    })
    renderCards(f)
  }

  function hideSplash() {
    var s = document.getElementById('splash')
    if (s) {
      s.classList.add('hidden')
      setTimeout(function() { if (s.parentNode) s.parentNode.removeChild(s) }, 800)
    }
  }

  function init() {
    var saved = 'nightSyscall'
    try { saved = localStorage.getItem('theme') || 'nightSyscall' } catch (_) {}
    setTheme(themeData[saved] ? saved : 'nightSyscall')

    fetch('src/index.json')
      .then(function(r) { return r.json() })
      .then(function(d) { window.__utils = d; renderCards(d) })
      .catch(function() { window.__utils = []; renderCards([]) })

    var toggle = document.getElementById('themeToggle')
    if (toggle) toggle.addEventListener('click', function() {
      setTheme(currentTheme === 'nightSyscall' ? 'daySyscall' : 'nightSyscall')
    })

    var search = document.getElementById('searchInput')
    if (search) {
      search.addEventListener('input', function(e) { filter(e.target.value) })
      search.addEventListener('blur', function() {
        if (!search.value) search.style.width = ''
      })
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function() {})
    }

    hideSplash()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
