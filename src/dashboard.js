;(function() {
  'use strict'

  var SECTION_KEY = 'flux-sections'

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
  var activeQuery = ''
  var sectionState = {}
  var sectionMeta = {}

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

  function loadSectionState() {
    try {
      var s = localStorage.getItem(SECTION_KEY)
      sectionState = s ? JSON.parse(s) : {}
    } catch (_) { sectionState = {} }
  }

  function saveSectionState() {
    try { localStorage.setItem(SECTION_KEY, JSON.stringify(sectionState)) } catch (_) {}
  }

  function cardHtml(item, delay) {
    return '<article class="card" style="animation-delay:' + delay + 's" onclick="window.location.href=\'' + item.filePath + '\'">' +
      '<h2 class="card-title">' + esc(item.heading) + '</h2>' +
      '<p class="card-description">' + esc(item.description) + '</p></article>'
  }

  function renderSections(data) {
    var c = document.getElementById('cardsContainer')
    var n = document.getElementById('noResults')
    if (!c || !n) return
    if (!data.length) { c.innerHTML = ''; n.style.display = 'block'; return }
    n.style.display = 'none'

    // Group by section, sort A-Z
    var groups = {}
    data.forEach(function(item) {
      var sec = item.section || 'other'
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(item)
    })

    var sectionNames = Object.keys(groups).sort(function(a, b) {
      if (a === 'minigames') return 1
      if (b === 'minigames') return -1
      return a.localeCompare(b)
    })
    var html = ''
    var globalDelay = 0

    sectionNames.forEach(function(sec) {
      groups[sec].sort(function(a, b) {
        return a.heading.toLowerCase().localeCompare(b.heading.toLowerCase())
      })

      var isOpen = sectionState[sec] !== false
      var count = groups[sec].length
      var secEsc = esc(sec)

      html += '<div class="section" data-section="' + secEsc + '">' +
        '<button class="section-head" aria-expanded="' + isOpen + '">' +
        '<span class="section-hash">#</span>' +
        '<span class="section-name">' + secEsc + '</span>' +
        '<span class="section-count">' + count + '</span>' +
        '<span class="section-arrow">' + (isOpen ? '\u25BC' : '\u25B6') + '</span>' +
        '</button>' +
        '<div class="section-body"' + (isOpen ? '' : ' style="display:none"') + '>' +
        '<div class="cards-grid">'

      groups[sec].forEach(function(item, i) {
        html += cardHtml(item, 0.08 + globalDelay * 0.04)
        globalDelay++
      })

      html += '</div></div></div>'
    })

    c.innerHTML = html

    c.querySelectorAll('.section-head').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var sec = btn.closest('.section').getAttribute('data-section')
        var body = btn.nextElementSibling
        var isOpen = body.style.display !== 'none'
        body.style.display = isOpen ? 'none' : ''
        btn.setAttribute('aria-expanded', !isOpen)
        btn.querySelector('.section-arrow').textContent = isOpen ? '\u25B6' : '\u25BC'
        sectionState[sec] = !isOpen
        saveSectionState()
      })
    })
  }

  function renderFlat(data) {
    var c = document.getElementById('cardsContainer')
    var n = document.getElementById('noResults')
    if (!c || !n) return
    if (!data.length) { c.innerHTML = ''; n.style.display = 'block'; return }
    n.style.display = 'none'
    c.innerHTML = '<div class="cards-grid">' +
      data.map(function(item, i) { return cardHtml(item, 0.08 + i * 0.04) }).join('') +
      '</div>'
  }

  function filter(q) {
    activeQuery = q
    q = q.toLowerCase().trim()
    if (!q) {
      renderSections(window.__utils)
      return
    }
    var f = window.__utils.filter(function(item) {
      return item.heading.toLowerCase().indexOf(q) !== -1 ||
        item.description.toLowerCase().indexOf(q) !== -1 ||
        (item.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1 })
    })
    renderFlat(f)
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
    loadSectionState()

    fetch('src/index.json')
      .then(function(r) { return r.json() })
      .then(function(d) { window.__utils = d; renderSections(d) })
      .catch(function() { window.__utils = []; renderSections([]) })

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
