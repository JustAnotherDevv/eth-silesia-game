import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 800
const H = 480
const GRAVITY     = 0.48
const JUMP_VEL    = -12.5
const MOVE_SPEED  = 3.8
const WORLD_W     = 5200
const GROUND_Y    = H - 80   // y of ground surface
const CHAR_H      = 72       // character height
const WALK_TICKS  = 6        // ticks per walk frame

// ── Encounter data ────────────────────────────────────────────────────────────
const ENCOUNTERS = [
  {
    id: 'landlord', x: 1000, w: 70, h: 96, label: 'THE LANDLORD', color: '#E63946',
    question: 'Your landlord demands 3 months rent upfront. You should:',
    choices: [
      { text: "Pay immediately — can't risk losing the flat", correct: false, reason: "Always negotiate. 1 month deposit is the legal norm." },
      { text: 'Negotiate — 1 month deposit is standard', correct: true,  reason: "Correct! Most countries cap deposits at 1–2 months rent." },
      { text: 'Sign the contract first, discuss money later', correct: false, reason: "Never sign without agreeing on ALL financial terms first." },
    ],
  },
  {
    id: 'cryptobro', x: 2200, w: 70, h: 96, label: 'CRYPTO BRO', color: '#7B2D8B',
    question: '"MoonSquirrel Coin is GUARANTEED to 100x!" This is:',
    choices: [
      { text: 'A great opportunity — get in early!', correct: false, reason: "No investment is ever guaranteed. Classic pump-and-dump red flag." },
      { text: 'Classic pump-and-dump scam', correct: true,  reason: "Correct! 'Guaranteed returns' is the #1 sign of investment fraud." },
      { text: 'Risky but worth a small bet', correct: false, reason: "You can never know future returns. Never invest more than you can lose." },
    ],
  },
  {
    id: 'hacker', x: 3600, w: 70, h: 96, label: 'THE HACKER', color: '#1565C0',
    question: 'Email from "PKO Bank" asks you to verify your login. You:',
    choices: [
      { text: 'Click the link — looks totally official', correct: false, reason: "Phishing emails are built to look real. Always verify directly." },
      { text: 'Reply with your password to confirm identity', correct: false, reason: "Banks NEVER ask for passwords by email. This is phishing." },
      { text: 'Delete it and log in at the official site directly', correct: true,  reason: "Correct! Go directly to the bank's real URL — never via email links." },
    ],
  },
]

const PLATFORMS = [
  { x: 180,  y: GROUND_Y - 110, w: 150, h: 22 },
  { x: 440,  y: GROUND_Y - 170, w: 120, h: 22 },
  { x: 650,  y: GROUND_Y - 115, w: 180, h: 22 },
  { x: 1300, y: GROUND_Y - 140, w: 140, h: 22 },
  { x: 1550, y: GROUND_Y - 190, w: 110, h: 22 },
  { x: 1760, y: GROUND_Y - 120, w: 160, h: 22 },
  { x: 2500, y: GROUND_Y - 155, w: 130, h: 22 },
  { x: 2750, y: GROUND_Y - 110, w: 150, h: 22 },
  { x: 2980, y: GROUND_Y - 170, w: 120, h: 22 },
  { x: 3300, y: GROUND_Y - 130, w: 140, h: 22 },
  { x: 4000, y: GROUND_Y - 145, w: 130, h: 22 },
  { x: 4280, y: GROUND_Y - 180, w: 100, h: 22 },
]

interface Player {
  x: number; y: number; vx: number; vy: number
  onGround: boolean; facingRight: boolean
  walkFrame: number; walkTick: number
  hp: number; invincible: number
}
interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; r: number
}
interface GS {
  player: Player; camera: number; tick: number
  defeated: Set<string>; xp: number; stars: number
  phase: 'playing' | 'quiz' | 'win'; encounter: typeof ENCOUNTERS[0] | null
}

// ── Background ────────────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D, camX: number) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, '#4A90D9')
  sky.addColorStop(1, '#C8E6F5')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, GROUND_Y)

  // Halftone dots on sky
  ctx.fillStyle = 'rgba(0,0,0,0.025)'
  for (let dy = 6; dy < GROUND_Y; dy += 12) {
    for (let dx = (Math.floor(dy / 12) % 2 === 0 ? 0 : 6); dx < W; dx += 12) {
      ctx.beginPath(); ctx.arc(dx, dy, 1.1, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Far buildings (parallax 0.12) — tiled every 1400
  const farColors = ['#B8896A', '#C99870', '#D4A878', '#A87858']
  const farB = [
    { ox: 60,  w: 80,  h: 140 }, { ox: 200, w: 60, h: 110 }, { ox: 320, w: 95, h: 165 },
    { ox: 470, w: 70,  h: 130 }, { ox: 600, w: 100,h: 180 }, { ox: 760, w: 65, h: 120 },
    { ox: 890, w: 85,  h: 155 }, { ox: 1040,w: 75, h: 142 }, { ox: 1180,w: 90, h: 168 },
    { ox: 1320,w: 72,  h: 128 },
  ]
  const tileW1 = 1400
  const p1 = camX * 0.12
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  for (const b of farB) {
    for (let rep = -1; rep <= Math.ceil(W / tileW1) + 1; rep++) {
      const bx = b.ox + rep * tileW1 - p1
      if (bx > W + 10 || bx + b.w < -10) continue
      ctx.fillStyle = farColors[farB.indexOf(b) % farColors.length]
      ctx.beginPath(); ctx.roundRect(bx, GROUND_Y - b.h, b.w, b.h, 3); ctx.fill(); ctx.stroke()
      ctx.fillStyle = 'rgba(255,220,130,0.6)'
      for (let wy = GROUND_Y - b.h + 14; wy < GROUND_Y - 18; wy += 28) {
        for (let wx = bx + 7; wx < bx + b.w - 10; wx += 20) {
          ctx.fillRect(wx, wy, 10, 10)
          ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1; ctx.strokeRect(wx, wy, 10, 10)
          ctx.lineWidth = 2; ctx.strokeStyle = '#1A0800'
        }
      }
    }
  }

  // Mid buildings (parallax 0.38) — tiled every 1300
  const midColors = ['#E8A87C', '#D4836A', '#C97B58', '#F0B88C']
  const midB = [
    { ox: 30,  w: 110, h: 205 }, { ox: 200, w: 90,  h: 172 }, { ox: 360, w: 130, h: 225 },
    { ox: 550, w: 98,  h: 188 }, { ox: 710, w: 120, h: 215 }, { ox: 900, w: 92,  h: 180 },
    { ox: 1060,w: 115, h: 210 }, { ox: 1240,w: 105, h: 198 },
  ]
  const tileW2 = 1300
  const p2 = camX * 0.38
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#1A0800'
  for (const b of midB) {
    for (let rep = -1; rep <= Math.ceil(W / tileW2) + 2; rep++) {
      const bx = b.ox + rep * tileW2 - p2
      if (bx > W + 10 || bx + b.w < -10) continue
      ctx.fillStyle = midColors[midB.indexOf(b) % midColors.length]
      ctx.beginPath(); ctx.roundRect(bx, GROUND_Y - b.h, b.w, b.h, 5); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#FFCD00'
      ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
      for (let wy = GROUND_Y - b.h + 18; wy < GROUND_Y - 24; wy += 34) {
        for (let wx = bx + 9; wx < bx + b.w - 14; wx += 26) {
          ctx.fillRect(wx, wy, 13, 13); ctx.strokeRect(wx, wy, 13, 13)
        }
      }
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#1A0800'
    }
  }

  // Ground
  ctx.fillStyle = '#7B5E2A'
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
  ctx.fillStyle = '#5DC264'
  ctx.fillRect(0, GROUND_Y, W, 20)
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 20); ctx.lineTo(W, GROUND_Y + 20); ctx.stroke()
}

// ── Platform ──────────────────────────────────────────────────────────────────
function drawPlatform(ctx: CanvasRenderingContext2D, p: typeof PLATFORMS[0], camX: number) {
  const sx = p.x - camX
  if (sx > W + 60 || sx + p.w < -60) return
  ctx.fillStyle = '#7B5E2A'
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.roundRect(sx, p.y, p.w, p.h, 7); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#5DC264'
  ctx.beginPath(); ctx.roundRect(sx, p.y, p.w, 11, [7, 7, 0, 0]); ctx.fill()
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(sx, p.y + 11); ctx.lineTo(sx + p.w, p.y + 11); ctx.stroke()
}

// ── Frog character ────────────────────────────────────────────────────────────
function drawFrog(ctx: CanvasRenderingContext2D, player: Player, camX: number) {
  const sx = player.x - camX
  const sy = player.y

  ctx.save()
  // Horizontal flip for facing direction
  if (!player.facingRight) {
    ctx.translate(sx + 16, 0); ctx.scale(-1, 1); ctx.translate(-(sx + 16), 0)
  }

  const bobY = player.onGround && Math.abs(player.vx) > 0.3
    ? Math.sin(player.walkFrame * Math.PI / 3) * 2.5 : 0
  const legSwing = Math.sin(player.walkFrame * Math.PI / 3) * 16
  const bx = sx; const by = sy + bobY

  // ── Legs ──────────────────────────────────────────────────
  const drawLeg = (offX: number, swingDir: number) => {
    ctx.save()
    ctx.translate(bx + offX, by + 50)
    ctx.rotate(swingDir * legSwing * Math.PI / 180)
    ctx.strokeStyle = '#3A9E42'; ctx.lineWidth = 7
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.stroke()
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.stroke()
    ctx.fillStyle = '#3A9E42'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.ellipse(0, 20, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.restore()
  }
  drawLeg(8, 1); drawLeg(24, -1)

  // ── Body ──────────────────────────────────────────────────
  ctx.fillStyle = '#5DC264'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(bx + 16, by + 38, 17, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // Bow tie
  const drawBowtieHalf = (dx: number, flip: number) => {
    ctx.save(); ctx.translate(bx + 16, by + 50); ctx.scale(flip, 1)
    ctx.fillStyle = '#E63946'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.closePath()
    ctx.fill(); ctx.stroke(); ctx.restore()
  }
  drawBowtieHalf(-8, -1); drawBowtieHalf(8, 1)
  ctx.fillStyle = '#C62828'; ctx.beginPath(); ctx.arc(bx + 16, by + 50, 3.5, 0, Math.PI * 2); ctx.fill()

  // ── Eye stalks ────────────────────────────────────────────
  ctx.fillStyle = '#5DC264'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(bx + 8,  by + 17, 8, 8, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(bx + 24, by + 17, 8, 8,  0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // ── Head ──────────────────────────────────────────────────
  ctx.fillStyle = '#5DC264'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(bx + 16, by + 27, 19, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // Eyes
  const drawEye = (ex: number, ey: number) => {
    ctx.fillStyle = 'white'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(ex, ey, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#1A0800'
    ctx.beginPath(); ctx.arc(ex + 1, ey - 1, 3.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'white'
    ctx.beginPath(); ctx.arc(ex + 2, ey - 2, 1.2, 0, Math.PI * 2); ctx.fill()
  }
  drawEye(bx + 8, by + 17); drawEye(bx + 24, by + 17)

  // Smile
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(bx + 16, by + 30, 7, 0.15, Math.PI - 0.15); ctx.stroke()

  // Hit flash
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
    ctx.fillStyle = 'rgba(255,80,80,0.45)'
    ctx.beginPath(); ctx.ellipse(bx + 16, by + 36, 22, 32, 0, 0, Math.PI * 2); ctx.fill()
  }

  ctx.restore()
}

// ── Enemies ───────────────────────────────────────────────────────────────────
function drawLandlord(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#1A0800'
  // Body
  ctx.fillStyle = '#FFB3BA'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(x + 35, y + 56, 28, 25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  // Head
  ctx.beginPath(); ctx.ellipse(x + 35, y + 25, 25, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  // Hat
  ctx.fillStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.fillRect(x + 21, y + 9,  27, 6); ctx.strokeRect(x + 21, y + 9, 27, 6)
  ctx.fillRect(x + 26, y + 2,  18, 9); ctx.strokeRect(x + 26, y + 2, 18, 9)
  // Dollar eyes
  ctx.fillStyle = 'white'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(x + 27, y + 22, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(x + 43, y + 22, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#2D9A4E'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('$', x + 27, y + 26); ctx.fillText('$', x + 43, y + 26)
  ctx.textAlign = 'left'
  // Snout
  ctx.fillStyle = '#FF8FA0'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(x + 35, y + 33, 10, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#C62828'
  ctx.beginPath(); ctx.arc(x + 30, y + 33, 2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + 40, y + 33, 2, 0, Math.PI * 2); ctx.fill()
  // Arms
  ctx.lineWidth = 5; ctx.strokeStyle = '#FFB3BA'
  ctx.beginPath(); ctx.moveTo(x + 9,  y + 48); ctx.lineTo(x + 2, y + 64);  ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 61, y + 48); ctx.lineTo(x + 68, y + 64); ctx.stroke()
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x + 9,  y + 48); ctx.lineTo(x + 2, y + 64);  ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 61, y + 48); ctx.lineTo(x + 68, y + 64); ctx.stroke()
  // Money bag
  ctx.fillStyle = '#FFCD00'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(x + 68, y + 68, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#1A0800'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('$', x + 68, y + 73); ctx.textAlign = 'left'
  // Legs
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(x + 24, y + 76); ctx.lineTo(x + 18, y + 92); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 46, y + 76); ctx.lineTo(x + 52, y + 92); ctx.stroke()
  ctx.fillStyle = '#1A0800'
  ctx.beginPath(); ctx.ellipse(x + 16, y + 95, 11, 5, -0.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(x + 54, y + 95, 11, 5,  0.2, 0, Math.PI * 2); ctx.fill()
}

function drawCryptoBro(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#1A0800'
  // Body / hoodie
  ctx.fillStyle = '#9B59B6'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(x + 35, y + 57, 27, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#7B2D8B'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('🌙', x + 35, y + 64); ctx.textAlign = 'left'
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(x + 35, y + 57, 27, 24, 0, 0, Math.PI * 2); ctx.stroke()
  // Head
  ctx.fillStyle = '#FDBCB4'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(x + 35, y + 26, 22, 21, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  // Spiky hair
  ctx.fillStyle = '#1A0800'
  for (let i = 0; i < 5; i++) {
    const hx = x + 16 + i * 8
    ctx.beginPath(); ctx.moveTo(hx - 4, y + 15); ctx.lineTo(hx, y + 4); ctx.lineTo(hx + 4, y + 15); ctx.closePath(); ctx.fill()
  }
  // Sunglasses
  ctx.fillStyle = '#1A0800'
  ctx.beginPath(); ctx.roundRect(x + 16, y + 21, 13, 9, 3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(x + 31, y + 21, 13, 9, 3); ctx.fill()
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(x + 29, y + 25); ctx.lineTo(x + 31, y + 25); ctx.stroke()
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x + 13, y + 25); ctx.lineTo(x + 16, y + 25); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 44, y + 25); ctx.lineTo(x + 57, y + 25); ctx.stroke()
  // Smirk
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(x + 37, y + 37, 6, 0.1, Math.PI * 0.8); ctx.stroke()
  // Arms
  ctx.lineWidth = 5; ctx.strokeStyle = '#9B59B6'
  ctx.beginPath(); ctx.moveTo(x + 10, y + 48); ctx.quadraticCurveTo(x + 4, y + 64, x + 8, y + 74); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 60, y + 48); ctx.quadraticCurveTo(x + 66, y + 64, x + 62, y + 74); ctx.stroke()
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x + 10, y + 48); ctx.quadraticCurveTo(x + 4, y + 64, x + 8, y + 74); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 60, y + 48); ctx.quadraticCurveTo(x + 66, y + 64, x + 62, y + 74); ctx.stroke()
  // Phone
  ctx.fillStyle = '#222'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(x + 59, y + 70, 11, 17, 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#00FF88'; ctx.font = '6px monospace'
  ctx.fillText('↑↑', x + 61, y + 81)
  // Legs
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(x + 24, y + 75); ctx.lineTo(x + 18, y + 93); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 46, y + 75); ctx.lineTo(x + 52, y + 93); ctx.stroke()
  ctx.fillStyle = '#7B2D8B'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(x + 16, y + 96, 11, 5, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(x + 54, y + 96, 11, 5,  0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
}

function drawHacker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#1A0800'
  // Hoodie body
  ctx.fillStyle = '#1E1E3F'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(x + 35, y + 56, 28, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  // Head
  ctx.fillStyle = '#FDBCB4'
  ctx.beginPath(); ctx.ellipse(x + 35, y + 25, 22, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  // Hood over head
  ctx.fillStyle = '#1E1E3F'; ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x + 35, y + 18, 28, Math.PI + 0.25, -0.25)
  ctx.lineTo(x + 35, y + 10); ctx.closePath(); ctx.fill(); ctx.stroke()
  // Mask
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.roundRect(x + 19, y + 28, 32, 17, 5); ctx.fill()
  // Glow eyes
  ctx.fillStyle = '#00FF88'
  ctx.shadowColor = '#00FF88'; ctx.shadowBlur = 10
  ctx.beginPath(); ctx.arc(x + 27, y + 24, 5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + 43, y + 24, 5, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  // Arms
  ctx.lineWidth = 5; ctx.strokeStyle = '#1E1E3F'
  ctx.beginPath(); ctx.moveTo(x + 9,  y + 46); ctx.lineTo(x + 4,  y + 64); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 61, y + 46); ctx.lineTo(x + 66, y + 64); ctx.stroke()
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x + 9,  y + 46); ctx.lineTo(x + 4,  y + 64); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 61, y + 46); ctx.lineTo(x + 66, y + 64); ctx.stroke()
  // Laptop
  ctx.fillStyle = '#2C2C54'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.roundRect(x + 8, y + 60, 32, 21, 3); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#00FF88'; ctx.font = '6px monospace'
  ctx.fillText('0x1f', x + 12, y + 70)
  ctx.fillText('null', x + 12, y + 78)
  // Legs
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(x + 24, y + 74); ctx.lineTo(x + 17, y + 92); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 46, y + 74); ctx.lineTo(x + 53, y + 92); ctx.stroke()
  ctx.fillStyle = '#1E1E3F'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(x + 15, y + 95, 11, 5, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(x + 55, y + 95, 11, 5,  0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
}

function drawEnemy(ctx: CanvasRenderingContext2D, enc: typeof ENCOUNTERS[0], camX: number, defeated: boolean, tick: number) {
  const sx = enc.x - camX
  if (sx > W + 100 || sx < -100) return

  if (defeated) {
    ctx.fillStyle = '#FFCD00'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + tick * 0.05
      const r = 22 + Math.sin(tick * 0.1 + i) * 6
      ctx.beginPath()
      ctx.arc(sx + enc.w / 2 + Math.cos(a) * r, enc.y + enc.h / 2 + Math.sin(a) * r * 0.5 - camX * 0, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#5DC264'; ctx.font = "bold 24px 'Fredoka One', cursive"; ctx.textAlign = 'center'
    ctx.fillText('✓', sx + enc.w / 2, enc.y + enc.h / 2 + 8)
    ctx.textAlign = 'left'
    return
  }

  const bounce = Math.sin(tick * 0.05) * 4
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath(); ctx.ellipse(sx + enc.w / 2, enc.y + enc.h + 4, enc.w * 0.5, 7, 0, 0, Math.PI * 2); ctx.fill()

  ctx.save(); ctx.translate(sx, bounce)
  if (enc.id === 'landlord') drawLandlord(ctx, 0, enc.y - bounce)
  else if (enc.id === 'cryptobro') drawCryptoBro(ctx, 0, enc.y - bounce)
  else drawHacker(ctx, 0, enc.y - bounce)
  ctx.restore()

  // Nametag
  ctx.font = "bold 11px 'Fredoka One', cursive"; ctx.textAlign = 'center'
  const tw = ctx.measureText(enc.label).width
  const lx = sx + enc.w / 2; const ly = enc.y - 18 + Math.sin(tick * 0.04) * 3
  ctx.fillStyle = enc.color; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.roundRect(lx - tw / 2 - 9, ly - 15, tw + 18, 22, 7); ctx.fill(); ctx.stroke()
  ctx.fillStyle = 'white'; ctx.fillText(enc.label, lx, ly)
  ctx.textAlign = 'left'
}

// ── Goal flag ─────────────────────────────────────────────────────────────────
function drawGoal(ctx: CanvasRenderingContext2D, camX: number, tick: number) {
  const gx = WORLD_W - 100 - camX
  if (gx > W + 120 || gx < -120) return
  ctx.fillStyle = '#7B5E2A'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2.5
  ctx.fillRect(gx + 15, GROUND_Y - 210, 9, 210); ctx.strokeRect(gx + 15, GROUND_Y - 210, 9, 210)
  const wave = Math.sin(tick * 0.09) * 12
  ctx.fillStyle = '#FFCD00'; ctx.lineWidth = 2; ctx.strokeStyle = '#1A0800'
  ctx.beginPath()
  ctx.moveTo(gx + 24, GROUND_Y - 210)
  ctx.quadraticCurveTo(gx + 56 + wave, GROUND_Y - 190, gx + 60 + wave, GROUND_Y - 175)
  ctx.quadraticCurveTo(gx + 56 + wave, GROUND_Y - 158, gx + 24, GROUND_Y - 148)
  ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.font = "16px sans-serif"; ctx.textAlign = 'center'
  ctx.fillText('🏁', gx + 42 + wave * 0.5, GROUND_Y - 171)
  ctx.textAlign = 'left'
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, hp: number, xp: number, defeated: number) {
  // HP panel
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.strokeStyle = '#FFCD00'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.roundRect(12, 12, 130, 36, 10); ctx.fill(); ctx.stroke()
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = hp > i ? '#E63946' : '#444'
    ctx.font = '22px sans-serif'; ctx.fillText('♥', 20 + i * 40, 38)
  }
  // XP panel
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.roundRect(W - 138, 12, 126, 36, 10); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#FFCD00'; ctx.font = "bold 15px 'Fredoka One', cursive"; ctx.textAlign = 'right'
  ctx.fillText(`⭐ ${xp} XP`, W - 16, 35)
  ctx.textAlign = 'left'
  // Progress bar
  const bx = 16, by = H - 32, bw = W - 32, bh = 16
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.strokeStyle = '#FFCD00'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 8); ctx.fill()
  ctx.fillStyle = '#1A0800'
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.stroke()
  const progress = Math.min(defeated / 3, 1)
  ctx.fillStyle = '#FFCD00'
  if (progress > 0) { ctx.beginPath(); ctx.roundRect(bx, by, bw * progress, bh, 6); ctx.fill() }
  ctx.strokeStyle = '#FFCD00'
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.stroke()
  // Enemy dots
  for (const enc of ENCOUNTERS) {
    const mx = bx + (enc.x / WORLD_W) * bw
    ctx.fillStyle = defeated >= ENCOUNTERS.indexOf(enc) + 1 ? '#5DC264' : enc.color
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(mx, by + bh / 2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
  // Goal dot
  ctx.fillStyle = '#FFCD00'; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(bx + bw - 5, by + bh / 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#1A0800'
  ctx.fillText('★', bx + bw - 5, by + bh / 2 + 3); ctx.textAlign = 'left'
}

// ── Film grain ────────────────────────────────────────────────────────────────
function drawGrain(ctx: CanvasRenderingContext2D, tick: number) {
  for (let y = 0; y < H; y += 4) { ctx.fillStyle = 'rgba(0,0,0,0.025)'; ctx.fillRect(0, y, W, 1) }
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.85)
  vig.addColorStop(0, 'transparent'); vig.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)
  if (tick % 3 === 0) {
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5)
    }
  }
}

// ── Particles ─────────────────────────────────────────────────────────────────
function updateParticles(particles: Particle[]): Particle[] {
  return particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.life--; return p.life > 0
  })
}
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camX: number) {
  for (const p of particles) {
    ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife
    ctx.beginPath(); ctx.arc(p.x - camX, p.y, p.r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EpisodeNew() {
  const navigate = useNavigate()
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const keysRef     = useRef({ left: false, right: false, up: false })

  const gsRef = useRef<GS>({
    player: { x: 60, y: GROUND_Y - CHAR_H, vx: 0, vy: 0, onGround: true, facingRight: true, walkFrame: 0, walkTick: 0, hp: 3, invincible: 0 },
    camera: 0, tick: 0, defeated: new Set(), xp: 0, stars: 0,
    phase: 'playing', encounter: null,
  })

  const [phase,        setPhase]        = useState<'playing'|'quiz'|'win'>('playing')
  const [encounter,    setEncounter]    = useState<typeof ENCOUNTERS[0] | null>(null)
  const [choiceResult, setChoiceResult] = useState<{ correct: boolean; reason: string } | null>(null)
  const [xpDisplay,    setXpDisplay]    = useState(0)
  const [hpDisplay,    setHpDisplay]    = useState(3)
  const [showHint,     setShowHint]     = useState(true)
  const [quizAnim,     setQuizAnim]     = useState(false)

  // Key input
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') keysRef.current.left  = true
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !keysRef.current.up) keysRef.current.up = true
      if (e.key !== ' ') setShowHint(false)
      if (e.key === ' ') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') keysRef.current.left  = false
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false
      if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === ' ') keysRef.current.up = false
    }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  // Show quiz with animation
  const triggerQuiz = useCallback((enc: typeof ENCOUNTERS[0]) => {
    setEncounter(enc)
    setChoiceResult(null)
    setPhase('quiz')
    requestAnimationFrame(() => setQuizAnim(true))
  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function tick() {
      const gs = gsRef.current
      const k  = keysRef.current

      if (gs.phase !== 'playing') { rafRef.current = requestAnimationFrame(tick); return }

      gs.tick++
      const p = gs.player

      // Movement
      if (k.left)  { p.vx = -MOVE_SPEED; p.facingRight = false }
      else if (k.right) { p.vx = MOVE_SPEED; p.facingRight = true }
      else p.vx *= 0.72

      // Jump
      if (k.up && p.onGround) { p.vy = JUMP_VEL; p.onGround = false; k.up = false }

      // Physics
      p.vy = Math.min(p.vy + GRAVITY, 18)
      p.y += p.vy
      p.x += p.vx
      p.x  = Math.max(10, Math.min(p.x, WORLD_W - 50))

      // Ground
      p.onGround = false
      if (p.y >= GROUND_Y - CHAR_H) { p.y = GROUND_Y - CHAR_H; p.vy = 0; p.onGround = true }

      // Platforms
      if (p.vy >= 0) {
        for (const pl of PLATFORMS) {
          if (p.x + 28 > pl.x && p.x + 4 < pl.x + pl.w && p.y + CHAR_H > pl.y && p.y + CHAR_H < pl.y + pl.h + 14) {
            p.y = pl.y - CHAR_H; p.vy = 0; p.onGround = true
          }
        }
      }

      // Walk animation
      if (Math.abs(p.vx) > 0.4) {
        if (++p.walkTick >= WALK_TICKS) { p.walkTick = 0; p.walkFrame = (p.walkFrame + 1) % 6 }
      }
      if (p.invincible > 0) p.invincible--

      // Camera: smooth follow
      const targetCam = Math.max(0, Math.min(p.x - W * 0.38, WORLD_W - W))
      gs.camera += (targetCam - gs.camera) * 0.12

      // Encounter check
      for (const enc of ENCOUNTERS) {
        if (gs.defeated.has(enc.id)) continue
        if (p.x + 32 > enc.x && p.x < enc.x + enc.w && p.y + CHAR_H > enc.y) {
          gs.phase = 'quiz'; gs.encounter = enc
          triggerQuiz(enc); return
        }
      }

      // Win check
      if (p.x >= WORLD_W - 120) { gs.phase = 'win'; setPhase('win'); return }

      // Particles
      particlesRef.current = updateParticles(particlesRef.current)

      // Draw
      ctx.clearRect(0, 0, W, H)
      drawBg(ctx, gs.camera)
      for (const pl of PLATFORMS) drawPlatform(ctx, pl, gs.camera)
      drawGoal(ctx, gs.camera, gs.tick)
      for (const enc of ENCOUNTERS) drawEnemy(ctx, enc, gs.camera, gs.defeated.has(enc.id), gs.tick)
      drawParticles(ctx, particlesRef.current, gs.camera)
      drawFrog(ctx, p, gs.camera)
      drawHUD(ctx, p.hp, gs.xp, gs.defeated.size)
      drawGrain(ctx, gs.tick)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [triggerQuiz])

  const handleChoice = useCallback((idx: number) => {
    if (choiceResult || !encounter) return
    const ch = encounter.choices[idx]
    setChoiceResult({ correct: ch.correct, reason: ch.reason })
    const gs = gsRef.current
    if (ch.correct) {
      gs.defeated.add(encounter.id); gs.xp += 100; gs.stars++
      setXpDisplay(gs.xp)
      // Spawn confetti
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2, sp = 4 + Math.random() * 5
        particlesRef.current.push({
          x: encounter.x + 35, y: encounter.y + 40,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5,
          life: 55, maxLife: 55,
          color: ['#FFCD00','#E63946','#5DC264','#7B2D8B','#FF7B25'][i % 5],
          r: 4 + Math.random() * 4,
        })
      }
    } else {
      gs.player.hp = Math.max(0, gs.player.hp - 1)
      gs.player.invincible = 60
      setHpDisplay(gs.player.hp)
    }
  }, [encounter, choiceResult])

  const dismissQuiz = useCallback(() => {
    const gs = gsRef.current
    // Push player back so they don't immediately re-trigger
    gs.player.x   -= 100
    gs.player.vx   = -5
    gs.phase = 'playing'; gs.encounter = null
    setQuizAnim(false)
    setTimeout(() => { setPhase('playing'); setEncounter(null); setChoiceResult(null) }, 80)
  }, [])

  const touchStart = useCallback((dir: 'left'|'right'|'up') => {
    keysRef.current[dir] = true; setShowHint(false)
  }, [])
  const touchEnd = useCallback((dir: 'left'|'right'|'up') => {
    keysRef.current[dir] = false
  }, [])

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#0D0507', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', fontFamily:"'Fredoka Variable',sans-serif" }}>

      {/* Game window */}
      <div style={{ position:'relative', border:'4px solid #1A0800', borderRadius:'10px', boxShadow:'0 0 0 3px #FFCD00, 0 0 0 6px #1A0800, 12px 12px 40px rgba(0,0,0,0.9)' }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display:'block' }}/>

        {/* Controls hint */}
        {showHint && phase === 'playing' && (
          <div style={{ position:'absolute', bottom:54, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.75)', color:'#FFCD00', padding:'8px 22px', borderRadius:'9999px', fontFamily:"'Fredoka One',cursive", fontSize:'0.82rem', whiteSpace:'nowrap', border:'2px solid #FFCD00', pointerEvents:'none', letterSpacing:'0.04em' }}>
            ← → Move &nbsp;·&nbsp; ↑ / Space Jump &nbsp;·&nbsp; Defeat the villains!
          </div>
        )}

        {/* Quiz overlay */}
        {phase === 'quiz' && encounter && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div style={{
              background:'#FEF9EE', border:'4px solid #1A0800', borderRadius:'22px', padding:'28px 32px',
              maxWidth:'460px', width:'100%', boxShadow:'8px 8px 0 #1A0800',
              transform: quizAnim ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
              opacity: quizAnim ? 1 : 0,
              transition:'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
            }}>
              <div style={{ textAlign:'center', marginBottom:'14px' }}>
                <span style={{ background:encounter.color, color:'white', fontFamily:"'Fredoka One',cursive", fontSize:'0.65rem', letterSpacing:'0.14em', padding:'3px 14px', borderRadius:'9999px', border:'2px solid #1A0800', boxShadow:'2px 2px 0 #1A0800' }}>
                  ⚡ ENCOUNTER: {encounter.label}
                </span>
              </div>
              <p style={{ fontFamily:"'Fredoka One',cursive", fontSize:'1.05rem', lineHeight:1.35, textAlign:'center', marginBottom:'18px', color:'#1A0800' }}>
                {encounter.question}
              </p>
              {!choiceResult ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
                  {encounter.choices.map((ch, i) => (
                    <button key={i} onClick={() => handleChoice(i)} style={{ padding:'11px 18px', border:'3px solid #1A0800', borderRadius:'14px', background:'white', fontFamily:"'Fredoka Variable',sans-serif", fontWeight:600, fontSize:'0.88rem', cursor:'pointer', textAlign:'left', boxShadow:'3px 3px 0 #1A0800', transition:'transform 0.1s, box-shadow 0.1s', lineHeight:1.35 }}
                      onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow='5px 5px 0 #1A0800' }}
                      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='3px 3px 0 #1A0800' }}
                      onMouseDown={e  => { e.currentTarget.style.transform='translate(1px,1px)';  e.currentTarget.style.boxShadow='1px 1px 0 #1A0800' }}
                    >{ch.text}</button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'3.2rem', marginBottom:'6px' }}>{choiceResult.correct ? '🎉' : '😬'}</div>
                  <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:'1.25rem', color: choiceResult.correct ? '#2D9A4E' : '#E63946', marginBottom:'6px' }}>
                    {choiceResult.correct ? '+100 XP Earned!' : 'Wrong! −1 HP'}
                  </div>
                  <p style={{ fontFamily:"'Fredoka Variable',sans-serif", fontWeight:500, fontSize:'0.88rem', color:'#555', marginBottom:'18px', lineHeight:1.55 }}>
                    {choiceResult.reason}
                  </p>
                  <button onClick={dismissQuiz} style={{ padding:'12px 36px', border:'3px solid #1A0800', borderRadius:'9999px', background: choiceResult.correct ? '#FFCD00' : '#E63946', color:'#1A0800', fontFamily:"'Fredoka One',cursive", fontSize:'0.95rem', cursor:'pointer', boxShadow:'4px 4px 0 #1A0800', transition:'transform 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform='' }}
                  >
                    {choiceResult.correct ? 'Keep Going! →' : 'Try Again! →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Win screen */}
        {phase === 'win' && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'#FEF9EE', border:'4px solid #1A0800', borderRadius:'26px', padding:'44px', textAlign:'center', boxShadow:'8px 8px 0 #1A0800' }}>
              <div style={{ fontSize:'4rem', marginBottom:'10px' }}>🏆</div>
              <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:'2.2rem', marginBottom:'8px', color:'#1A0800' }}>Level Complete!</h2>
              <div style={{ display:'flex', justifyContent:'center', gap:'10px', marginBottom:'14px' }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ fontSize:'2.4rem', opacity: gsRef.current.stars > i ? 1 : 0.25, filter: gsRef.current.stars > i ? 'none' : 'grayscale(1)' }}>⭐</span>
                ))}
              </div>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:'1.5rem', background:'#1A0800', color:'#FFCD00', borderRadius:'14px', padding:'10px 28px', marginBottom:'24px', display:'inline-block' }}>
                {xpDisplay} XP Earned!
              </div>
              <div style={{ display:'flex', gap:'14px', justifyContent:'center' }}>
                <button onClick={() => window.location.reload()} style={{ padding:'13px 28px', border:'3px solid #1A0800', borderRadius:'9999px', background:'#FFCD00', fontFamily:"'Fredoka One',cursive", fontSize:'0.95rem', cursor:'pointer', boxShadow:'4px 4px 0 #1A0800' }}>
                  Play Again
                </button>
                <button onClick={() => navigate('/')} style={{ padding:'13px 28px', border:'3px solid #1A0800', borderRadius:'9999px', background:'white', fontFamily:"'Fredoka One',cursive", fontSize:'0.95rem', cursor:'pointer', boxShadow:'4px 4px 0 #1A0800' }}>
                  ← Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Touch / on-screen controls */}
      <div style={{ display:'flex', gap:'14px', marginTop:'14px', alignItems:'center' }}>
        {(['left','right'] as const).map(dir => (
          <button key={dir}
            onPointerDown={() => touchStart(dir)} onPointerUp={() => touchEnd(dir)} onPointerLeave={() => touchEnd(dir)}
            style={{ width:58, height:58, border:'3px solid #FFCD00', borderRadius:'16px', background:'rgba(255,205,0,0.12)', color:'#FFCD00', fontSize:'1.5rem', cursor:'pointer', userSelect:'none', touchAction:'none', display:'flex', alignItems:'center', justifyContent:'center' }}
          >{dir === 'left' ? '◀' : '▶'}</button>
        ))}
        <button
          onPointerDown={() => touchStart('up')} onPointerUp={() => touchEnd('up')} onPointerLeave={() => touchEnd('up')}
          style={{ width:58, height:58, border:'3px solid #5DC264', borderRadius:'9999px', background:'rgba(93,194,100,0.12)', color:'#5DC264', fontSize:'1.6rem', cursor:'pointer', userSelect:'none', touchAction:'none', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One',cursive" }}
        >↑</button>
      </div>

      <button onClick={() => navigate('/')} style={{ marginTop:'10px', background:'transparent', border:'none', color:'rgba(255,205,0,0.45)', fontFamily:"'Fredoka One',cursive", fontSize:'0.72rem', cursor:'pointer', letterSpacing:'0.12em' }}>
        ← BACK TO HOME
      </button>
    </div>
  )
}
