;(function(root) {
  'use strict'

  function generateShades(r, g, b, count) {
    var out = []
    for (var i = 0; i < count; i++) {
      var t = (i + 1) / (count + 1)
      out.push({
        r: Math.round(r * t),
        g: Math.round(g * t),
        b: Math.round(b * t)
      })
    }
    return out
  }

  function generateTints(r, g, b, count) {
    var out = []
    for (var i = 0; i < count; i++) {
      var t = (i + 1) / (count + 1)
      out.push({
        r: Math.round(r + (255 - r) * t),
        g: Math.round(g + (255 - g) * t),
        b: Math.round(b + (255 - b) * t)
      })
    }
    return out
  }

  function fromHsl(h, s, l) {
    var rgb = ColorMath.hslToRgb(h, s / 100, l / 100)
    return { r: rgb.r, g: rgb.g, b: rgb.b }
  }

  function fromHsv(h, s, v) {
    var rgb = ColorMath.hsvToRgb(h / 360, s / 100, v / 100)
    return { r: rgb.r, g: rgb.g, b: rgb.b }
  }

  function computeSchemes(r, g, b) {
    var hsl = ColorMath.rgbToHsl(r, g, b)
    var hsv = ColorMath.rgbToHsv(r, g, b)
    var h = hsl.h * 360
    var s = hsl.s * 100
    var l = hsl.l * 100
    var sv = hsv.v * 100
    var count = 6

    function wrap(deg) {
      return ((deg % 360) + 360) % 360
    }

    var schemes = {}

    /* Monochromatic: same hue, vary saturation + lightness */
    schemes.Monochrome = []
    for (var mi = 0; mi < count; mi++) {
      var mt = mi / (count - 1)
      schemes.Monochrome.push(fromHsl(h, 5 + mt * 95, 15 + mt * 70))
    }

    /* Complementary: hue + 180 */
    var compH = wrap(h + 180)
    schemes.Complementary = [
      { r: r, g: g, b: b },
      fromHsl(compH, s, l)
    ]

    /* Analogous: hue ± offsets */
    schemes.Analogous = []
    var analogSteps = [-2, -1, 0, 1, 2]
    for (var ai = 0; ai < analogSteps.length; ai++) {
      schemes.Analogous.push(fromHsl(wrap(h + analogSteps[ai] * 25), s, l))
    }

    /* Triadic: hue + 0, +120, +240 */
    schemes.Triadic = [
      { r: r, g: g, b: b },
      fromHsl(wrap(h + 120), s, l),
      fromHsl(wrap(h + 240), s, l)
    ]

    /* Split complementary: base, +150, +210 */
    schemes['Split Comp.'] = [
      { r: r, g: g, b: b },
      fromHsl(wrap(h + 150), s, l),
      fromHsl(wrap(h + 210), s, l)
    ]

    /* Tetradic: two complementary pairs offset by 60 */
    schemes.Tetradic = [
      { r: r, g: g, b: b },
      fromHsl(wrap(h + 60), s, l),
      fromHsl(wrap(h + 180), s, l),
      fromHsl(wrap(h + 240), s, l)
    ]

    /* Shades: vary value down */
    schemes.Shades = generateShades(r, g, b, count)

    /* Tints: mix with white */
    schemes.Tints = generateTints(r, g, b, count)

    return schemes
  }

  root.ColorSchemes = { compute: computeSchemes }
})(this)
