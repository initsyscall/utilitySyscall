;(function() {
  'use strict'

  /* ── State ── */
  var color = { r: 162, g: 119, b: 255, a: 1 }
  var outputMode = 'hex'
  var dragTarget = null

  /* ── DOM Refs ── */
  var els = {}

  function $(id) { return document.getElementById(id) }

  /* ── Init ── */
  function init() {
    els.spectrum = $('spectrum')
    els.spectrumCtx = els.spectrum.getContext('2d')
    els.hueBar = $('hueBar')
    els.hueCtx = els.hueBar.getContext('2d')
    els.alphaBar = $('alphaBar')
    els.alphaCtx = els.alphaBar.getContext('2d')
    els.preview = $('preview')
    els.hexInput = $('hexInput')
    els.modeBtns = document.querySelectorAll('.mode-btn')
    els.schemesContainer = $('schemesContainer')
    els.sliders = {
      r: { slider: $('rSlider'), input: $('rInput') },
      g: { slider: $('gSlider'), input: $('gInput') },
      b: { slider: $('bSlider'), input: $('bInput') },
      a: { slider: $('aSlider'), input: $('aInput') },
      h: { slider: $('hSlider'), input: $('hInput') },
      s: { slider: $('sSlider'), input: $('sInput') },
      l: { slider: $('lSlider'), input: $('lInput') }
    }
    els.hslGroup = $('hslGroup')
    els.rgbGroup = $('rgbGroup')
    els.alphaGroup = $('alphaGroup')

    resizeCanvases()
    drawHueBar()
    drawAlphaBar()
    updateAll()

    /* Spectrum drag */
    els.spectrum.addEventListener('mousedown', onSpectrumDown)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    els.spectrum.addEventListener('touchstart', onSpectrumTouch, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onUp)

    /* Hue bar drag */
    els.hueBar.addEventListener('mousedown', onHueDown)
    els.hueBar.addEventListener('touchstart', onHueTouch, { passive: false })

    /* Alpha bar drag */
    els.alphaBar.addEventListener('mousedown', onAlphaDown)
    els.alphaBar.addEventListener('touchstart', onAlphaTouch, { passive: false })

    /* Slider inputs */
    Object.keys(els.sliders).forEach(function(k) {
      var c = els.sliders[k]
      c.slider.addEventListener('input', function() { onSliderInput(k, parseFloat(c.slider.value)) })
      c.input.addEventListener('change', function() {
        var v = parseFloat(c.input.value)
        if (!isNaN(v)) onSliderInput(k, v)
        else updateSliders()
      })
    })

    /* HEX input */
    els.hexInput.addEventListener('input', onHexInput)
    els.hexInput.addEventListener('blur', function() { updateHexInput() })

    /* Mode buttons */
    els.modeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        outputMode = btn.getAttribute('data-mode')
        els.modeBtns.forEach(function(b) { b.classList.remove('active') })
        btn.classList.add('active')
        updateOutput()
      })
    })

    /* Click preview to copy */
    els.preview.addEventListener('click', onCopy)

    /* Schemes toggle */
    els.schemesToggle = $('schemesToggle')
    els.schemesBody = $('schemesBody')
    els.schemesToggle.addEventListener('click', function() {
      var open = els.schemesBody.classList.toggle('open')
      els.schemesToggle.classList.toggle('open')
    })

    /* Window resize */
    window.addEventListener('resize', function() {
      resizeCanvases()
      drawHueBar()
      drawAlphaBar()
      drawSpectrum()
    })
  }

  /* ── Canvas sizing ── */
  function resizeCanvases() {
    var rect = els.spectrum.parentElement.getBoundingClientRect()
    var w = rect.width
    els.spectrum.width = w * 2
    els.spectrum.height = 200 * 2
    els.spectrum.style.height = '200px'

    var hw = els.hueBar.parentElement.getBoundingClientRect().width
    els.hueBar.width = hw * 2
    els.hueBar.height = 16 * 2
    els.hueBar.style.height = '16px'

    var aw = els.alphaBar.parentElement.getBoundingClientRect().width
    els.alphaBar.width = aw * 2
    els.alphaBar.height = 16 * 2
    els.alphaBar.style.height = '16px'
  }

  /* ── Drawing ── */
  function drawSpectrum() {
    var w = els.spectrum.width, h = els.spectrum.height
    var ctx = els.spectrumCtx
    var hsv = ColorMath.rgbToHsv(color.r, color.g, color.b)

    for (var x = 0; x < w; x++) {
      var sat = x / w
      ctx.fillStyle = 'hsl(' + (hsv.h * 360) + ', 100%, 50%)'
      ctx.fillRect(x, 0, 1, h)
    }

    var grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  function drawHueBar() {
    var w = els.hueBar.width, h = els.hueBar.height
    var ctx = els.hueCtx
    for (var x = 0; x < w; x++) {
      ctx.fillStyle = 'hsl(' + (x / w * 360) + ', 100%, 50%)'
      ctx.fillRect(x, 0, 1, h)
    }
  }

  function drawAlphaBar() {
    var w = els.alphaBar.width, h = els.alphaBar.height
    var ctx = els.alphaCtx
    var c = ColorMath.formatColor(color.r, color.g, color.b, 1, 'hex')

    /* checkerboard bg */
    var pat = document.createElement('canvas')
    pat.width = 12; pat.height = 12
    var pctx = pat.getContext('2d')
    pctx.fillStyle = '#555'
    pctx.fillRect(0, 0, 12, 12)
    pctx.fillStyle = '#666'
    pctx.fillRect(0, 0, 6, 6)
    pctx.fillRect(6, 6, 6, 6)
    var pattern = ctx.createPattern(pat, 'repeat')
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, w, h)

    /* color gradient */
    var grad = ctx.createLinearGradient(0, 0, w, 0)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, c)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  /* ── Update ── */
  function updateAll() {
    drawSpectrum()
    drawAlphaBar()
    updateSliderRanges()
    updateSliders()
    updateHexInput()
    updateOutput()
    updatePreview()
    updateIndicators()
    renderSchemes()
  }

  function updateSliderRanges() {
    var hsv = ColorMath.rgbToHsv(color.r, color.g, color.b)
    var hsl = ColorMath.rgbToHsl(color.r, color.g, color.b)

    /* HSL sliders: update gradient backgrounds */
    setSliderGradient('h', 'hsl(' + (hsl.h * 360) + ', 100%, 50%)',
      'linear-gradient(to right, ' + [0, 60, 120, 180, 240, 300, 360].map(function(d) {
        return 'hsl(' + d + ', 100%, 50%) ' + (d / 360 * 100) + '%'
      }).join(',') + ')')

    setSliderGradient('s', 'hsl(' + (hsl.h * 360) + ', ' + Math.round(hsl.s * 100) + '%, 50%)',
      'linear-gradient(to right, hsl(' + (hsl.h * 360) + ', 0%, 50%), hsl(' + (hsl.h * 360) + ', 100%, 50%))')

    setSliderGradient('l', 'hsl(' + (hsl.h * 360) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%)',
      'linear-gradient(to right, hsl(' + (hsl.h * 360) + ', ' + Math.round(hsl.s * 100) + '%, 0%), hsl(' + (hsl.h * 360) + ', ' + Math.round(hsl.s * 100) + '%, 50%), hsl(' + (hsl.h * 360) + ', ' + Math.round(hsl.s * 100) + '%, 100%))')

    setSliderGradient('r', ColorMath.formatColor(color.r, color.g, color.b, 1, 'hex'),
      'linear-gradient(to right, rgb(0,' + color.g + ',' + color.b + '), rgb(255,' + color.g + ',' + color.b + '))')

    setSliderGradient('g', ColorMath.formatColor(color.r, color.g, color.b, 1, 'hex'),
      'linear-gradient(to right, rgb(' + color.r + ',0,' + color.b + '), rgb(' + color.r + ',255,' + color.b + '))')

    setSliderGradient('b', ColorMath.formatColor(color.r, color.g, color.b, 1, 'hex'),
      'linear-gradient(to right, rgb(' + color.r + ',' + color.g + ',0), rgb(' + color.r + ',' + color.g + ',255))')

    /* Alpha gradient */
    setSliderGradient('a', ColorMath.formatColor(color.r, color.g, color.b, color.a, 'hex'),
      'linear-gradient(to right, transparent, ' + ColorMath.formatColor(color.r, color.g, color.b, 1, 'hex') + ')')
  }

  function setSliderGradient(ch, thumbColor, cssGrad) {
    var s = els.sliders[ch]
    s.slider.style.background = cssGrad
    s.slider.style.setProperty('--thumb-color', thumbColor)
  }

  function updateSliders() {
    var hsl = ColorMath.rgbToHsl(color.r, color.g, color.b)
    var hsv = ColorMath.rgbToHsv(color.r, color.g, color.b)

    els.sliders.r.slider.value = color.r
    els.sliders.r.input.value = color.r
    els.sliders.g.slider.value = color.g
    els.sliders.g.input.value = color.g
    els.sliders.b.slider.value = color.b
    els.sliders.b.input.value = color.b
    els.sliders.a.slider.value = color.a
    els.sliders.a.input.value = color.a.toFixed(2)

    var hd = Math.round(hsl.h * 360)
    els.sliders.h.slider.value = hd
    els.sliders.h.input.value = hd
    els.sliders.s.slider.value = Math.round(hsl.s * 100)
    els.sliders.s.input.value = Math.round(hsl.s * 100)
    els.sliders.l.slider.value = Math.round(hsl.l * 100)
    els.sliders.l.input.value = Math.round(hsl.l * 100)
  }

  function updateHexInput() {
    if (document.activeElement !== els.hexInput) {
      els.hexInput.value = ColorMath.formatColor(color.r, color.g, color.b, color.a, 'hex')
    }
  }

  function updateOutput() {
    els.hexInput.value = ColorMath.formatColor(color.r, color.g, color.b, color.a, outputMode)
  }

  function updatePreview() {
    var c = ColorMath.formatColor(color.r, color.g, color.b, 1, 'hex')
    els.preview.style.background =
      'linear-gradient(' + c + ', ' + c + '), repeating-conic-gradient(#555 0% 25%, #666 0% 50%) 50% / 12px 12px'
    els.preview.style.opacity = color.a
  }

  function updateIndicators() {
    var rect = els.spectrum.getBoundingClientRect()
    var hsv = ColorMath.rgbToHsv(color.r, color.g, color.b)
    var sx = hsv.s * els.spectrum.width / 2
    var sy = (1 - hsv.v) * els.spectrum.height / 2
    els.spectrum.style.setProperty('--cx', (sx / rect.width * 100) + '%')
    els.spectrum.style.setProperty('--cy', (sy / rect.height * 100) + '%')

    var hueH = ColorMath.rgbToHsv(color.r, color.g, color.b).h
    els.hueBar.parentElement.style.setProperty('--hx', (hueH * 100) + '%')

    els.alphaBar.parentElement.style.setProperty('--ax', (color.a * 100) + '%')
  }

  /* ── Spectrum Input ── */
  function onSpectrumDown(e) {
    dragTarget = 'spectrum'
    setSpectrumFromEvent(e)
  }

  function onSpectrumTouch(e) {
    e.preventDefault()
    dragTarget = 'spectrum'
    setSpectrumFromEvent(e.touches[0])
  }

  function setSpectrumFromEvent(e) {
    var rect = els.spectrum.getBoundingClientRect()
    var x = (e.clientX - rect.left) / rect.width
    var y = (e.clientY - rect.top) / rect.height
    x = ColorMath.clamp(x, 0, 1)
    y = ColorMath.clamp(y, 0, 1)
    var hsv = ColorMath.rgbToHsv(color.r, color.g, color.b)
    hsv.s = x
    hsv.v = 1 - y
    var rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v)
    color.r = rgb.r; color.g = rgb.g; color.b = rgb.b
    updateAll()
  }

  /* ── Hue Input ── */
  function onHueDown(e) { dragTarget = 'hue'; setHueFromEvent(e) }
  function onHueTouch(e) { e.preventDefault(); dragTarget = 'hue'; setHueFromEvent(e.touches[0]) }

  function setHueFromEvent(e) {
    var rect = els.hueBar.getBoundingClientRect()
    var x = (e.clientX - rect.left) / rect.width
    x = ColorMath.clamp(x, 0, 1)
    var hsv = ColorMath.rgbToHsv(color.r, color.g, color.b)
    hsv.h = x
    var rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v)
    color.r = rgb.r; color.g = rgb.g; color.b = rgb.b
    updateAll()
  }

  /* ── Alpha Input ── */
  function onAlphaDown(e) { dragTarget = 'alpha'; setAlphaFromEvent(e) }
  function onAlphaTouch(e) { e.preventDefault(); dragTarget = 'alpha'; setAlphaFromEvent(e.touches[0]) }

  function setAlphaFromEvent(e) {
    var rect = els.alphaBar.getBoundingClientRect()
    var x = (e.clientX - rect.left) / rect.width
    color.a = ColorMath.clamp(x, 0, 1)
    updateAll()
  }

  /* ── General drag ── */
  function onMove(e) {
    if (!dragTarget) return
    if (dragTarget === 'spectrum') setSpectrumFromEvent(e)
    else if (dragTarget === 'hue') setHueFromEvent(e)
    else if (dragTarget === 'alpha') setAlphaFromEvent(e)
  }

  function onTouchMove(e) {
    if (!dragTarget) return
    if (dragTarget === 'spectrum') setSpectrumFromEvent(e.touches[0])
    else if (dragTarget === 'hue') setHueFromEvent(e.touches[0])
    else if (dragTarget === 'alpha') setAlphaFromEvent(e.touches[0])
  }

  function onUp() { dragTarget = null }

  /* ── Slider input ── */
  function onSliderInput(ch, v) {
    switch (ch) {
      case 'r': color.r = ColorMath.clamp(Math.round(v), 0, 255); break
      case 'g': color.g = ColorMath.clamp(Math.round(v), 0, 255); break
      case 'b': color.b = ColorMath.clamp(Math.round(v), 0, 255); break
      case 'a': color.a = ColorMath.clamp(v, 0, 1); break
      case 'h': {
        var hsl = ColorMath.rgbToHsl(color.r, color.g, color.b)
        hsl.h = ColorMath.clamp(v, 0, 360) / 360
        var rgb = ColorMath.hslToRgb(hsl.h, hsl.s, hsl.l)
        color.r = rgb.r; color.g = rgb.g; color.b = rgb.b
        break
      }
      case 's': {
        var hsl2 = ColorMath.rgbToHsl(color.r, color.g, color.b)
        hsl2.s = ColorMath.clamp(v, 0, 100) / 100
        var rgb2 = ColorMath.hslToRgb(hsl2.h, hsl2.s, hsl2.l)
        color.r = rgb2.r; color.g = rgb2.g; color.b = rgb2.b
        break
      }
      case 'l': {
        var hsl3 = ColorMath.rgbToHsl(color.r, color.g, color.b)
        hsl3.l = ColorMath.clamp(v, 0, 100) / 100
        var rgb3 = ColorMath.hslToRgb(hsl3.h, hsl3.s, hsl3.l)
        color.r = rgb3.r; color.g = rgb3.g; color.b = rgb3.b
        break
      }
    }
    updateAll()
  }

  /* ── HEX input ── */
  function parseInput(str) {
    var r, g, b, a = 1
    var hex = ColorMath.hexToRgb(str)
    if (hex) { r = hex.r; g = hex.g; b = hex.b; if (str.replace('#','').length >= 8) a = parseInt(str.replace('#','').slice(6,8),16)/255 }
    else {
      var m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i.exec(str)
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; if (m[4] !== undefined) a = +m[4] }
      else {
        var m2 = /hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)/i.exec(str)
        if (m2) {
          var rgb = ColorMath.hslToRgb(+m2[1]/360, +m2[2]/100, +m2[3]/100)
          r = rgb.r; g = rgb.g; b = rgb.b; if (m2[4] !== undefined) a = +m2[4]
        }
      }
    }
    if (r !== undefined) return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: a }
    return null
  }

  function onHexInput() {
    var c = parseInput(els.hexInput.value)
    if (c) {
      color.r = c.r; color.g = c.g; color.b = c.b; color.a = c.a
      updateAll()
    }
  }

  /* ── Copy ── */
  function onCopy() {
    var text = ColorMath.formatColor(color.r, color.g, color.b, color.a, outputMode)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    } else {
      var ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch (_) {}
      document.body.removeChild(ta)
    }
    /* Flash feedback on preview */
    els.preview.style.transition = 'none'
    els.preview.style.boxShadow = '0 0 0 2px #A277FF, 0 0 24px rgba(162,119,255,0.4)'
    els.preview.style.transform = 'scale(1.05)'
    setTimeout(function() {
      els.preview.style.transition = ''
      els.preview.style.boxShadow = ''
      els.preview.style.transform = ''
    }, 250)
  }

  /* ── Schemes ── */
  function renderSchemes() {
    var schemes = ColorSchemes.compute(color.r, color.g, color.b)
    var names = Object.keys(schemes)
    var html = ''
    for (var si = 0; si < names.length; si++) {
      var name = names[si]
      var colors = schemes[name]
      html += '<div class="scheme-row"><span class="scheme-label">' + name + '</span><div class="scheme-swatches">'
      for (var ci = 0; ci < colors.length; ci++) {
        var c = colors[ci]
        var hex = ColorMath.formatColor(c.r, c.g, c.b, 1, 'hex')
        html += '<span class="scheme-swatch" data-sr="' + c.r + '" data-sg="' + c.g + '" data-sb="' + c.b + '" style="background:' + hex + '" title="' + hex + '"></span>'
      }
      html += '</div></div>'
    }
    els.schemesContainer.innerHTML = html

    els.schemesContainer.querySelectorAll('.scheme-swatch').forEach(function(el) {
      el.addEventListener('click', function() {
        color.r = parseInt(el.getAttribute('data-sr'))
        color.g = parseInt(el.getAttribute('data-sg'))
        color.b = parseInt(el.getAttribute('data-sb'))
        updateAll()
      })
    })
  }

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
