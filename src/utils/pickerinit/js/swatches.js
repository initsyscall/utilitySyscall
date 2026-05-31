;(function(root) {
  'use strict'

  var STORAGE_KEY = 'pickerinit-swatches'
  var swatches = []
  var onUpdate = null

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (Array.isArray(d)) { swatches = d; return }
    } catch (_) {}
    swatches = []
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(swatches)) } catch (_) {}
  }

  function getAll() { return swatches.slice() }

  function add(r, g, b, a) {
    swatches.push({ r: r, g: g, b: b, a: a !== undefined ? a : 1 })
    save()
    if (onUpdate) onUpdate(swatches)
  }

  function remove(index) {
    if (index >= 0 && index < swatches.length) {
      swatches.splice(index, 1)
      save()
      if (onUpdate) onUpdate(swatches)
    }
  }

  function render(container, onSelect) {
    container.innerHTML = ''
    swatches.forEach(function(c, i) {
      var el = document.createElement('button')
      var bg = c.a < 1
        ? 'linear-gradient(' + ColorMath.formatColor(c.r, c.g, c.b, 1, 'hex') + ', ' + ColorMath.formatColor(c.r, c.g, c.b, 1, 'hex') + '), ' +
          'repeating-conic-gradient(#666 0% 25%, #444 0% 50%) 50% / 10px 10px'
        : ColorMath.formatColor(c.r, c.g, c.b, 1, 'hex')
      el.style.background = bg
      el.className = 'swatch'
      el.title = ColorMath.formatColor(c.r, c.g, c.b, c.a, 'hex')
      el.setAttribute('aria-label', 'Color ' + ColorMath.formatColor(c.r, c.g, c.b, c.a, 'hex'))
      ;(function(idx) {
        el.addEventListener('click', function() { onSelect(swatches[idx]) })
        el.addEventListener('contextmenu', function(e) { e.preventDefault(); remove(idx) })
      })(i)
      container.appendChild(el)
    })
  }

  function onChange(fn) { onUpdate = fn }

  root.Swatches = { load: load, getAll: getAll, add: add, remove: remove, render: render, onChange: onChange }
})(this)
