;(function(root) {
  'use strict'

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    var h = 0, s = mx ? d / mx : 0, v = mx
    if (d) {
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      else if (mx === g) h = ((b - r) / d + 2) / 6
      else h = ((r - g) / d + 4) / 6
    }
    return { h: h, s: s, v: v }
  }

  function hsvToRgb(h, s, v) {
    var i = Math.floor(h * 6), f = h * 6 - i
    var p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
    var r, g, b
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break
      case 1: r = q; g = v; b = p; break
      case 2: r = p; g = v; b = t; break
      case 3: r = p; g = q; b = v; break
      case 4: r = t; g = p; b = v; break
      case 5: r = v; g = p; b = q; break
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    var h = 0, l = (mx + mn) / 2, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0
    if (d) {
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      else if (mx === g) h = ((b - r) / d + 2) / 6
      else h = ((r - g) / d + 4) / 6
    }
    return { h: h, s: s, l: l }
  }

  function hslToRgb(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h * 6) % 2 - 1)), m = l - c / 2
    var r, g, b
    var i = Math.floor(h * 6)
    switch (i % 6) {
      case 0: r = c; g = x; b = 0; break
      case 1: r = x; g = c; b = 0; break
      case 2: r = 0; g = c; b = x; break
      case 3: r = 0; g = x; b = c; break
      case 4: r = x; g = 0; b = c; break
      case 5: r = c; g = 0; b = x; break
    }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(c) {
      return ('0' + clamp(Math.round(c), 0, 255).toString(16)).slice(-2)
    }).join('')
  }

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{3,8})$/i.exec(String(hex).trim())
    if (!m) return null
    var s = m[1]
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
    if (s.length >= 6) {
      return {
        r: parseInt(s.slice(0, 2), 16),
        g: parseInt(s.slice(2, 4), 16),
        b: parseInt(s.slice(4, 6), 16)
      }
    }
    return null
  }

  function formatColor(r, g, b, a, mode) {
    var cr = clamp(Math.round(r), 0, 255)
    var cg = clamp(Math.round(g), 0, 255)
    var cb = clamp(Math.round(b), 0, 255)
    var ca = a !== undefined ? clamp(a, 0, 1) : 1
    switch (mode) {
      case 'rgb':
        return ca < 1
          ? 'rgba(' + cr + ', ' + cg + ', ' + cb + ', ' + ca.toFixed(2) + ')'
          : 'rgb(' + cr + ', ' + cg + ', ' + cb + ')'
      case 'hsl': {
        var hsl = rgbToHsl(cr, cg, cb)
        var hd = Math.round(hsl.h * 360), sd = Math.round(hsl.s * 100), ld = Math.round(hsl.l * 100)
        return ca < 1
          ? 'hsla(' + hd + ', ' + sd + '%, ' + ld + '%, ' + ca.toFixed(2) + ')'
          : 'hsl(' + hd + ', ' + sd + '%, ' + ld + '%)'
      }
      default:
        return ca < 1 ? rgbToHex(cr, cg, cb) + Math.round(ca * 255).toString(16).padStart(2, '0') : rgbToHex(cr, cg, cb)
    }
  }

  root.ColorMath = {
    clamp: clamp,
    rgbToHsv: rgbToHsv,
    hsvToRgb: hsvToRgb,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    rgbToHex: rgbToHex,
    hexToRgb: hexToRgb,
    formatColor: formatColor
  }
})(this)
