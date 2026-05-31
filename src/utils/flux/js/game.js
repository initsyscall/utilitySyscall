;(function() {
  'use strict'

  var STORAGE_KEY = 'flux-highscore'
  var state = 'idle'
  var score = 0
  var highScore = 0
  var timeout = 1500
  var decay = 5
  var timerId = null
  var targetSize = 60
  var spawnTime = 0

  var targetEl, scoreEl, highScoreEl
  var startOverlay, gameOverOverlay
  var finalScoreEl, finalBestEl
  var missFlashEl, gameEl

  var PARTICLE_COLORS = ['#A277FF', '#FF3366', '#F087BD', '#F6C177', '#80FFEA']

  function $(id) { return document.getElementById(id) }

  function init() {
    targetEl = $('target')
    scoreEl = $('score')
    highScoreEl = $('highScore')
    startOverlay = $('startOverlay')
    gameOverOverlay = $('gameOverOverlay')
    finalScoreEl = $('finalScore')
    finalBestEl = $('finalBest')
    missFlashEl = $('missFlash')
    gameEl = $('game')

    try { highScore = parseInt(localStorage.getItem(STORAGE_KEY)) || 0 } catch (_) {}
    updateHighScore()

    targetEl.addEventListener('click', onTargetClick)
    document.addEventListener('click', onMissClick)
    $('startBtn').addEventListener('click', startGame)
    $('restartBtn').addEventListener('click', startGame)
  }

  function startGame() {
    score = 0
    timeout = 1500
    decay = 5
    targetSize = 60
    state = 'playing'

    startOverlay.classList.remove('active')
    gameOverOverlay.classList.remove('active')

    updateScore()
    spawnTarget()
  }

  function spawnTarget() {
    if (state !== 'playing') return

    targetEl.classList.remove('visible', 'hit', 'miss')
    targetEl.style.display = 'block'

    var pad = targetSize + 20
    var x = pad + Math.random() * (window.innerWidth - pad * 2)
    var y = pad + Math.random() * (window.innerHeight - pad * 2)

    targetEl.style.width = targetSize + 'px'
    targetEl.style.height = targetSize + 'px'
    targetEl.style.left = (x - targetSize / 2) + 'px'
    targetEl.style.top = (y - targetSize / 2) + 'px'

    requestAnimationFrame(function() {
      targetEl.classList.add('visible')
      spawnTime = performance.now()
    })

    clearTimeout(timerId)
    timerId = setTimeout(function() {
      if (state === 'playing') missTarget()
    }, timeout)
  }

  function onTargetClick(e) {
    if (state !== 'playing') return
    e.stopPropagation()
    clearTimeout(timerId)

    var rect = targetEl.getBoundingClientRect()
    var cx = rect.left + rect.width / 2
    var cy = rect.top + rect.height / 2
    var rt = performance.now() - spawnTime
    showBurst(cx, cy, rt)

    score++
    updateScore()

    targetEl.classList.remove('visible')
    targetEl.style.display = 'none'

    scoreEl.classList.remove('pop')
    void scoreEl.offsetWidth
    scoreEl.classList.add('pop')

    if (score > 100) decay = 10
    else if (score > 50) decay = 8
    else if (score > 25) decay = 6
    timeout = Math.max(300, timeout - decay)
    targetSize = Math.max(24, 60 - Math.floor(score / 3))

    setTimeout(spawnTarget, 120)
  }

  function showBurst(cx, cy, ms) {
    var count = 14
    var container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:15'
    gameEl.appendChild(container)

    for (var i = 0; i < count; i++) {
      var p = document.createElement('div')
      var angle = Math.random() * 2 * Math.PI
      var dist = 40 + Math.random() * 90
      var dx = Math.cos(angle) * dist
      var dy = Math.sin(angle) * dist
      var size = 4 + Math.random() * 6
      var color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
      var dur = 300 + Math.random() * 400

      p.style.cssText =
        'position:fixed;left:' + cx + 'px;top:' + cy + 'px;' +
        'width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
        'background:' + color + ';' +
        'transform:translate(0,0);opacity:1;' +
        'transition:transform ' + dur + 'ms cubic-bezier(.22,1,.36,1),opacity ' + (dur + 100) + 'ms ease'
      container.appendChild(p)

      requestAnimationFrame(function() {
        p.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'
        p.style.opacity = '0'
      })
    }

    var label = document.createElement('div')
    label.textContent = Math.round(ms) + 'ms'
    label.style.cssText =
      'position:fixed;left:' + cx + 'px;top:' + cy + 'px;' +
      'font-size:14px;font-weight:700;color:#E0DEF4;' +
      'transform:translate(-50%,-50%) scale(0.5);opacity:0;' +
      'transition:transform 350ms cubic-bezier(.34,1.56,.64,1),opacity 300ms ease;' +
      'pointer-events:none;z-index:16'
    gameEl.appendChild(label)

    requestAnimationFrame(function() {
      label.style.transform = 'translate(-50%,-50%) scale(1)'
      label.style.opacity = '1'
    })

    setTimeout(function() {
      label.style.transform = 'translate(-50%,-120%) scale(0.8)'
      label.style.opacity = '0'
    }, 500)

    setTimeout(function() {
      if (container.parentNode) container.parentNode.removeChild(container)
      if (label.parentNode) label.parentNode.removeChild(label)
    }, 1200)
  }

  function onMissClick(e) {
    if (state !== 'playing') return
    if (e.target === targetEl) return
    if (e.target.closest('.overlay')) return
    missTarget()
  }

  function missTarget() {
    if (state !== 'playing') return
    state = 'gameover'

    clearTimeout(timerId)
    targetEl.style.display = 'none'

    missFlashEl.classList.remove('active')
    void missFlashEl.offsetWidth
    missFlashEl.classList.add('active')

    gameEl.classList.remove('shake')
    void gameEl.offsetWidth
    gameEl.classList.add('shake')

    var prev = highScore
    if (score > highScore) {
      highScore = score
      try { localStorage.setItem(STORAGE_KEY, highScore) } catch (_) {}
    }

    finalScoreEl.textContent = score
    finalBestEl.textContent = highScore + (score === highScore && score > 0 ? ' NEW' : '')

    setTimeout(function() {
      gameOverOverlay.classList.add('active')
      updateHighScore()
    }, 400)
  }

  function updateScore() {
    scoreEl.textContent = score
  }

  function updateHighScore() {
    highScoreEl.textContent = 'best ' + highScore
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
