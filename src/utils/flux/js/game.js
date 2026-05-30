;(function() {
  'use strict'

  var STORAGE_KEY = 'flux-highscore'
  var state = 'idle' // idle | playing | gameover
  var score = 0
  var highScore = 0
  var timeout = 1500
  var decay = 5
  var timerId = null
  var targetSize = 60

  var targetEl, scoreEl, highScoreEl
  var startOverlay, gameOverOverlay
  var finalScoreEl, finalBestEl
  var missFlashEl, gameEl

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

    score++
    updateScore()

    targetEl.classList.add('hit')
    targetEl.classList.remove('visible')

    scoreEl.classList.remove('pop')
    void scoreEl.offsetWidth
    scoreEl.classList.add('pop')

    // Difficulty scaling
    if (score > 100) decay = 10
    else if (score > 50) decay = 8
    else if (score > 25) decay = 6
    timeout = Math.max(300, timeout - decay)
    targetSize = Math.max(24, 60 - Math.floor(score / 3))

    setTimeout(spawnTarget, 150)
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
    targetEl.classList.remove('visible')
    targetEl.classList.add('miss')

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
      targetEl.style.display = 'none'
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
