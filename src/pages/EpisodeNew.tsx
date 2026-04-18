import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Constants ──────────────────────────────────────────────────────────────────
const W = 800, H = 480
const GRAV       = 0.52
const P_SPD      = 3.8
const JUMP_VEL   = -13
const GY         = H - 72   // ground Y
const FIRE_RATE  = 10
const BOSS_HALF  = 60       // half-height of boss hitbox

// ── Boss definitions ───────────────────────────────────────────────────────────
const BOSSES = [
  {
    id: 'landlord', name: 'THE LANDLORD', sub: 'Baron of Overpriced Rent',
    maxHp: 18, col: '#E63946',
    quiz: {
      q: 'Your landlord demands 3 months rent upfront. You should:',
      choices: [
        { t: 'Pay it immediately to keep the flat',          ok: false, why: "1 month deposit is the legal standard. Don't overpay." },
        { t: 'Negotiate — 1 month deposit is the law',       ok: true,  why: 'Correct! Deposits are capped at 1–2 months in most countries.' },
        { t: 'Sign first, negotiate money later',             ok: false, why: 'Never sign without agreeing on all financial terms first.' },
      ],
    },
  },
  {
    id: 'cryptobro', name: 'CRYPTO BRO', sub: 'King of MoonSquirrel Coin',
    maxHp: 24, col: '#7B2D8B',
    quiz: {
      q: '"MoonSquirrel Coin is GUARANTEED to 100x!" This is:',
      choices: [
        { t: 'A great opportunity — get in early!',          ok: false, why: 'No investment is ever guaranteed. Huge red flag.' },
        { t: 'Classic pump-and-dump fraud',                   ok: true,  why: "Correct! 'Guaranteed returns' = #1 sign of investment fraud." },
        { t: 'Risky but worth a small bet',                   ok: false, why: 'Never invest based on "guaranteed return" promises.' },
      ],
    },
  },
  {
    id: 'hacker', name: 'THE HACKER', sub: 'Phishing for Your Password',
    maxHp: 30, col: '#1565C0',
    quiz: {
      q: '"PKO Bank" emails you to verify your login. You:',
      choices: [
        { t: 'Click the link — it looks totally official',   ok: false, why: 'Phishing emails are designed to look real.' },
        { t: 'Reply with details to confirm your identity',  ok: false, why: 'Banks NEVER ask for passwords by email.' },
        { t: 'Delete it and go directly to the real site',   ok: true,  why: "Correct! Always navigate to the bank's site manually." },
      ],
    },
  },
]

const ARENA_PLATS = [
  [ { x:80, y:GY-130, w:160, h:18 }, { x:560, y:GY-130, w:160, h:18 }, { x:300, y:GY-210, w:200, h:18 } ],
  [ { x:60, y:GY-115, w:140, h:18 }, { x:600, y:GY-115, w:140, h:18 }, { x:290, y:GY-200, w:220, h:18 } ],
  [ { x:50, y:GY-135, w:140, h:18 }, { x:610, y:GY-135, w:140, h:18 }, { x:240, y:GY-235, w:320, h:18 }, { x:70, y:GY-285, w:110, h:18 }, { x:620, y:GY-285, w:110, h:18 } ],
]

// ── Types ──────────────────────────────────────────────────────────────────────
interface Player { x:number; y:number; vx:number; vy:number; onGround:boolean; facingRight:boolean; hp:number; invincible:number; fireCd:number; wFrame:number; wTick:number }
interface Boss   { x:number; y:number; vx:number; vy:number; hp:number; maxHp:number; phase:number; facingRight:boolean; onGround:boolean; state:string; stateTimer:number; hitFlash:number; aTick:number }
interface Proj   { id:number; x:number; y:number; vx:number; vy:number; type:string; life:number; r:number; owner:'p'|'b'; exploded?:boolean; exT?:number; exR?:number; exMax?:number; lPhase?:'warn'|'fire'; lTimer?:number; lx?:number; ly?:number; lw?:number; lh?:number; dir?:number; homing?:boolean }
type GP = 'intro'|'fight'|'quiz'|'bossdie'|'win'|'lost'
interface GS { player:Player; boss:Boss; bossIdx:number; projs:Proj[]; gp:GP; tick:number; introT:number; stars:number; xp:number; pid:number }

// ── Arena backgrounds ──────────────────────────────────────────────────────────
function drawArena(ctx: CanvasRenderingContext2D, id: string, tick: number) {
  if (id === 'landlord') {
    // Warm apartment
    ctx.fillStyle = '#F5E6C8'; ctx.fillRect(0, 0, W, H)
    // Wallpaper pattern
    ctx.fillStyle = 'rgba(180,120,60,0.08)'
    for (let y = 0; y < GY; y += 40) for (let x = (y/40)%2===0?0:20; x < W; x += 40) { ctx.fillRect(x, y, 18, 18) }
    // Fireplace
    ctx.fillStyle = '#8B4513'; ctx.fillRect(350, GY-180, 100, 180); ctx.strokeStyle='#1A0800'; ctx.lineWidth=3; ctx.strokeRect(350,GY-180,100,180)
    ctx.fillStyle = '#2C2C2C'; ctx.fillRect(360, GY-160, 80, 140)
    ctx.fillStyle = '#FF6B2B'; ctx.beginPath(); ctx.ellipse(400, GY-80, 25, 40, 0, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#FFCD00'; ctx.beginPath(); ctx.ellipse(400, GY-60, 15, 25, 0, 0, Math.PI*2); ctx.fill()
    // Dollar signs on wall
    ctx.fillStyle = 'rgba(45,154,78,0.3)'; ctx.font = "bold 40px 'Fredoka One',cursive"; ctx.textAlign='center'
    for (let i = 0; i < 6; i++) ctx.fillText('$', 60 + i*140, 80 + Math.sin(i)*20)
    ctx.textAlign = 'left'
    // Ground
    ctx.fillStyle = '#8B4513'; ctx.fillRect(0, GY, W, H-GY)
    ctx.fillStyle = '#A0522D'; for (let x=0;x<W;x+=60) ctx.fillRect(x,GY,58,10)
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke()
  } else if (id === 'cryptobro') {
    // Rooftop night
    const sky = ctx.createLinearGradient(0,0,0,GY)
    sky.addColorStop(0,'#0D0528'); sky.addColorStop(1,'#1a0a3d')
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,GY)
    // Stars
    ctx.fillStyle='white'
    for (let i=0;i<60;i++) { const sx=(i*137)%W, sy=(i*91)%GY*0.7, pulse=Math.sin(tick*0.03+i)*0.5+0.5; ctx.globalAlpha=0.4+pulse*0.6; ctx.beginPath(); ctx.arc(sx,sy,1+pulse,0,Math.PI*2); ctx.fill() }
    ctx.globalAlpha=1
    // Moon
    ctx.fillStyle='#FFF8DC'; ctx.shadowColor='#FFF8DC'; ctx.shadowBlur=20
    ctx.beginPath(); ctx.arc(680,60,45,0,Math.PI*2); ctx.fill()
    ctx.shadowBlur=0
    ctx.fillStyle='#FFCD00'; ctx.font="bold 28px sans-serif"; ctx.textAlign='center'
    ctx.fillText('🌙',680,73); ctx.textAlign='left'
    // City skyline
    const buildings = [[0,120,80],[100,160,90],[200,100,70],[320,180,100],[500,140,85],[620,110,75],[720,160,80]]
    ctx.fillStyle='#0D0528'
    for (const [bx,bh,bw] of buildings) { ctx.fillRect(bx,GY-bh,bw,bh); ctx.fillStyle='rgba(255,220,50,0.5)'; for(let wy=GY-bh+10;wy<GY-5;wy+=20) for(let wx=bx+6;wx<bx+bw-8;wx+=18) { if(Math.sin(wx*wy+tick*0.01)>0) ctx.fillRect(wx,wy,10,10) }; ctx.fillStyle='#0D0528' }
    // Coin symbols
    ctx.fillStyle='rgba(255,205,0,0.2)'; ctx.font="40px sans-serif"; ctx.textAlign='center'
    for(let i=0;i<4;i++) ctx.fillText('₿',100+i*200,50+Math.sin(tick*0.04+i)*15)
    ctx.textAlign='left'
    // Ground (rooftop)
    ctx.fillStyle='#444'; ctx.fillRect(0,GY,W,H-GY)
    ctx.fillStyle='#555'; ctx.fillRect(0,GY,W,8)
    ctx.strokeStyle='#1A0800'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke()
  } else {
    // Cyber void
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H)
    // Matrix rain
    ctx.fillStyle='rgba(0,255,100,0.12)'; ctx.font='12px monospace'
    for (let i=0;i<20;i++) { const col=(i*41+tick)%W, row=((tick*2+i*37)%(GY*1.5)); ctx.fillText(Math.random()>0.5?'1':'0',col,row) }
    // Circuit grid
    ctx.strokeStyle='rgba(0,100,255,0.15)'; ctx.lineWidth=1
    for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,GY);ctx.stroke()}
    for(let y=0;y<GY;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    // Glowing nodes
    ctx.fillStyle='rgba(0,255,100,0.5)'
    for(let i=0;i<12;i++){const nx=(i*113)%W,ny=(i*79)%GY,pulse=Math.sin(tick*0.05+i)*0.5+0.5;ctx.beginPath();ctx.arc(nx,ny,3+pulse*4,0,Math.PI*2);ctx.fill()}
    // Ground
    ctx.fillStyle='#0A1020'; ctx.fillRect(0,GY,W,H-GY)
    ctx.fillStyle='rgba(0,255,100,0.4)'; ctx.strokeStyle='#00FF64'; ctx.lineWidth=3
    ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke()
    ctx.fillStyle='rgba(0,100,255,0.3)'; ctx.lineWidth=1
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,GY);ctx.lineTo(x,H);ctx.stroke()}
  }
}

function drawPlat(ctx: CanvasRenderingContext2D, p: {x:number;y:number;w:number;h:number}, bossId: string) {
  ctx.fillStyle = bossId==='hacker' ? '#0A1030' : bossId==='cryptobro' ? '#444' : '#7B5E2A'
  ctx.strokeStyle = bossId==='hacker' ? '#00FF64' : '#1A0800'; ctx.lineWidth=2.5
  ctx.beginPath(); ctx.roundRect(p.x,p.y,p.w,p.h,6); ctx.fill(); ctx.stroke()
  ctx.fillStyle = bossId==='hacker' ? 'rgba(0,255,100,0.5)' : bossId==='cryptobro' ? '#666' : '#5DC264'
  ctx.beginPath(); ctx.roundRect(p.x,p.y,p.w,10,[6,6,0,0]); ctx.fill()
}

// ── Boss drawing ───────────────────────────────────────────────────────────────
function drawBossHP(ctx: CanvasRenderingContext2D, boss: Boss, bossData: typeof BOSSES[0]) {
  const bw=300, bh=18, bx=(W-bw)/2, by=14
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.strokeStyle='#1A0800'; ctx.lineWidth=2
  ctx.beginPath(); ctx.roundRect(bx-2,by-2,bw+4,bh+4,8); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#333'
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,6); ctx.fill()
  const ratio = Math.max(0, boss.hp/boss.maxHp)
  ctx.fillStyle = boss.phase>=2 ? '#FF2200' : boss.phase>=1 ? '#FF7B25' : bossData.col
  if(ratio>0){ ctx.beginPath(); ctx.roundRect(bx,by,bw*ratio,bh,6); ctx.fill() }
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=2
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,6); ctx.stroke()
  ctx.fillStyle='white'; ctx.font="bold 12px 'Fredoka One',cursive"; ctx.textAlign='center'
  ctx.fillText(`${bossData.name} — ${boss.hp}/${boss.maxHp} HP`, W/2, by+bh*2+6)
  if(boss.phase>=1){ ctx.fillStyle=boss.phase>=2?'#FF2200':'#FF7B25'; ctx.font="bold 10px 'Fredoka One',cursive"; ctx.fillText(boss.phase>=2?'⚡ ENRAGED':'⚠ PHASE 2', W/2, by+bh*3+6) }
  ctx.textAlign='left'
}

function drawBossLandlord(ctx: CanvasRenderingContext2D, boss: Boss, tick: number) {
  const p2 = boss.phase >= 2
  const bounce = Math.sin(tick * 0.07) * (4 + boss.phase * 2)
  const sc = 1 + boss.phase * 0.12
  const cx = boss.x, cy = boss.y - BOSS_HALF + bounce
  ctx.save(); ctx.translate(cx, cy); ctx.scale(boss.facingRight?sc:-sc, sc)
  const fc = p2 ? '#FF5566' : '#FFB3BA', hc = p2 ? '#FF8888' : '#FFDDE2'
  ctx.strokeStyle='#1A0800'
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0,85,45,10,0,0,Math.PI*2); ctx.fill()
  // Legs
  const legSwing = Math.sin(boss.aTick*0.1)*10
  for(const[ox,sw] of [[-20,1],[20,-1]] as [number,number][]) {
    ctx.fillStyle=fc; ctx.lineWidth=4
    ctx.save(); ctx.translate(ox,60); ctx.rotate(sw*legSwing*Math.PI/180)
    ctx.beginPath(); ctx.roundRect(-8,0,16,28,4); ctx.fill(); ctx.stroke()
    ctx.fillStyle='#1A0800'; ctx.beginPath(); ctx.ellipse(0,30,14,6,0,0,Math.PI*2); ctx.fill()
    ctx.restore()
  }
  // Body
  ctx.fillStyle=fc; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,42,38,32,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  // Tie
  ctx.fillStyle='#E63946'; ctx.beginPath(); ctx.moveTo(-6,20); ctx.lineTo(0,50); ctx.lineTo(6,20); ctx.closePath(); ctx.fill(); ctx.stroke()
  // Arms
  const armSwing = Math.sin(boss.aTick*0.12)*20
  for(const[sx,dir] of [[-38,1],[38,-1]] as [number,number][]) {
    ctx.save(); ctx.translate(sx,30); ctx.rotate(dir*armSwing*Math.PI/180)
    ctx.fillStyle=fc; ctx.lineWidth=3
    ctx.beginPath(); ctx.ellipse(dir<0?-12:12,20,10,24,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
    ctx.restore()
  }
  // Head
  ctx.fillStyle=hc; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,-5,36,32,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  // Hat
  ctx.fillStyle='#1A0800'
  ctx.beginPath(); ctx.roundRect(-38,-44,76,10,3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-24,-80,48,38,4); ctx.fill()
  if(p2){ ctx.strokeStyle='#FF2200'; ctx.lineWidth=2; ctx.strokeRect(-24,-80,48,38) }
  // Eyes
  if(p2) {
    ctx.strokeStyle='#1A0800'; ctx.lineWidth=3
    for(const ex of[-16,16]){ctx.beginPath();ctx.moveTo(ex-7,-15);ctx.lineTo(ex+7,-1);ctx.moveTo(ex+7,-15);ctx.lineTo(ex-7,-1);ctx.stroke()}
  } else {
    ctx.fillStyle='white'; ctx.lineWidth=1.5
    for(const ex of[-16,16]){ctx.beginPath();ctx.arc(ex,-8,10,0,Math.PI*2);ctx.fill();ctx.stroke()}
    ctx.fillStyle='#1C7D2E'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'
    ctx.fillText('$',-16,-4); ctx.fillText('$',16,-4); ctx.textAlign='left'
  }
  // Snout
  ctx.fillStyle='#FF8FA0'; ctx.lineWidth=2
  ctx.beginPath(); ctx.ellipse(0,8,14,10,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#C62828'
  ctx.beginPath(); ctx.arc(-6,8,3,0,Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(6,8,3,0,Math.PI*2); ctx.fill()
  // Hit flash
  if(boss.hitFlash>0){ ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/12})`; ctx.beginPath(); ctx.ellipse(0,20,50,65,0,0,Math.PI*2); ctx.fill() }
  ctx.restore()
}

function drawBossCrypto(ctx: CanvasRenderingContext2D, boss: Boss, tick: number) {
  const p2 = boss.phase>=2
  const float = Math.sin(tick*0.06)*8 + (boss.phase*5)
  const sc = 1+boss.phase*0.1
  const cx=boss.x, cy=boss.y-BOSS_HALF+float
  ctx.save(); ctx.translate(cx,cy); ctx.scale(boss.facingRight?sc:-sc,sc)
  // Glow aura in phase2
  if(p2){ ctx.fillStyle='rgba(123,45,139,0.25)'; ctx.beginPath(); ctx.arc(0,30,70,0,Math.PI*2); ctx.fill() }
  // Shadow (floating)
  const shadowScale = 0.5+float*0.01; ctx.fillStyle='rgba(0,0,0,0.15)'
  ctx.beginPath(); ctx.ellipse(0,100,40*shadowScale,8*shadowScale,0,0,Math.PI*2); ctx.fill()
  ctx.strokeStyle='#1A0800'
  // Body
  ctx.fillStyle= p2?'#9B3CB9':'#9B59B6'; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,45,34,30,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='22px sans-serif'; ctx.textAlign='center'
  ctx.fillText('🌙',0,56); ctx.textAlign='left'
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,45,34,30,0,0,Math.PI*2); ctx.stroke()
  // Arms
  const armSwing = Math.sin(boss.aTick*0.1)*25
  ctx.save(); ctx.translate(-34,36); ctx.rotate(-armSwing*Math.PI/180)
  ctx.fillStyle='#FDBCB4'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(-12,18,10,22,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  // Phone
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.roundRect(-24,30,14,20,2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='rgba(0,255,136,0.9)'; ctx.font='7px monospace'
  ctx.fillText('↑↑',-22,43)
  ctx.restore()
  ctx.save(); ctx.translate(34,36); ctx.rotate(armSwing*Math.PI/180)
  ctx.fillStyle='#FDBCB4'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(12,18,10,22,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.restore()
  // Head
  ctx.fillStyle='#FDBCB4'; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,-4,28,26,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  // Spiky hair
  ctx.fillStyle='#1A0800'
  for(let i=0;i<5;i++){const hx=-16+i*8;ctx.beginPath();ctx.moveTo(hx-4,-24);ctx.lineTo(hx,-36);ctx.lineTo(hx+4,-24);ctx.closePath();ctx.fill()}
  // Sunglasses
  ctx.fillStyle = p2?'#7B2D8B':'#1A0800'
  ctx.beginPath(); ctx.roundRect(-24,-12,18,11,3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-1,-12,18,11,3); ctx.fill()
  ctx.strokeStyle='#666'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.moveTo(-6,-7); ctx.lineTo(-1,-7); ctx.stroke()
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=2
  for(const ex of[-30,17]){ctx.beginPath();ctx.moveTo(ex,-7);ctx.lineTo(ex<0?-24:35,-7);ctx.stroke()}
  // Smirk
  ctx.lineWidth=2.5; ctx.strokeStyle='#1A0800'
  ctx.beginPath(); ctx.arc(6,8,8,0,Math.PI*0.8); ctx.stroke()
  if(boss.hitFlash>0){ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/12})`;ctx.beginPath();ctx.ellipse(0,20,45,60,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

function drawBossHacker(ctx: CanvasRenderingContext2D, boss: Boss, tick: number) {
  const p2 = boss.phase>=2
  const jitter = p2 ? (Math.random()-0.5)*4 : 0
  const sc = 1+boss.phase*0.1
  const cx=boss.x+jitter, cy=boss.y-BOSS_HALF
  ctx.save(); ctx.translate(cx,cy); ctx.scale(boss.facingRight?sc:-sc,sc)
  ctx.strokeStyle='#1A0800'
  // Glow
  if(p2){ctx.fillStyle='rgba(0,255,100,0.15)';ctx.beginPath();ctx.arc(0,30,75,0,Math.PI*2);ctx.fill()}
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,92,42,10,0,0,Math.PI*2);ctx.fill()
  // Legs
  for(const ox of[-20,20]){
    ctx.fillStyle='#1E1E3F';ctx.lineWidth=4
    ctx.beginPath();ctx.roundRect(ox-7,62,14,28,3);ctx.fill();ctx.stroke()
    ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(ox,92,13,6,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  }
  // Body
  ctx.fillStyle='#1E1E3F';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,42,34,30,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Laptop (floats in front)
  const lapBob = Math.sin(tick*0.09)*5
  ctx.fillStyle='#2C2C54';ctx.lineWidth=2.5
  ctx.beginPath();ctx.roundRect(-24,22+lapBob,48,32,4);ctx.fill();ctx.stroke()
  ctx.fillStyle=p2?'#FF4400':'#00FF64'
  ctx.shadowColor=p2?'#FF4400':'#00FF64';ctx.shadowBlur=8
  ctx.font='7px monospace'
  for(let i=0;i<3;i++)ctx.fillText(['0x1F','NULL','ERR'][i],-20,32+i*8+lapBob)
  ctx.shadowBlur=0
  // Arms
  ctx.lineWidth=5;ctx.strokeStyle='#1E1E3F'
  ctx.beginPath();ctx.moveTo(-34,30);ctx.quadraticCurveTo(-48,50,-28,56);ctx.stroke()
  ctx.beginPath();ctx.moveTo(34,30);ctx.quadraticCurveTo(48,50,28,56);ctx.stroke()
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(-34,30);ctx.quadraticCurveTo(-48,50,-28,56);ctx.stroke()
  ctx.beginPath();ctx.moveTo(34,30);ctx.quadraticCurveTo(48,50,28,56);ctx.stroke()
  // Head
  ctx.fillStyle='#FDBCB4';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,-4,26,24,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Hood
  ctx.fillStyle='#1E1E3F'
  ctx.beginPath();ctx.arc(0,-10,34,Math.PI+0.2,-0.2);ctx.lineTo(0,-18);ctx.closePath();ctx.fill();ctx.stroke()
  // Mask
  ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-18,-2,36,20,4);ctx.fill()
  // Glowing eyes
  ctx.fillStyle=p2?'#FF4400':'#00FF64'
  ctx.shadowColor=p2?'#FF4400':'#00FF64';ctx.shadowBlur=12
  ctx.beginPath();ctx.arc(-10,-10,5,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.arc(10,-10,5,0,Math.PI*2);ctx.fill()
  ctx.shadowBlur=0
  if(boss.hitFlash>0){ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/12})`;ctx.beginPath();ctx.ellipse(0,20,48,70,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

// ── Player (frog) ──────────────────────────────────────────────────────────────
function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, tick: number) {
  const bob = p.onGround && Math.abs(p.vx)>0.3 ? Math.sin(p.wFrame*Math.PI/3)*2.5 : 0
  const ls   = Math.sin(p.wFrame*Math.PI/3)*14
  const bx=p.x, by=p.y+bob
  ctx.save()
  if(!p.facingRight){ctx.translate(bx+16,0);ctx.scale(-1,1);ctx.translate(-(bx+16),0)}
  ctx.strokeStyle='#1A0800'
  // Legs
  for(const[ox,sw] of[[8,1],[24,-1]] as [number,number][]){
    ctx.save();ctx.translate(bx+ox,by+50);ctx.rotate(sw*ls*Math.PI/180)
    ctx.strokeStyle='#3A9E42';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.stroke()
    ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.stroke()
    ctx.fillStyle='#3A9E42';ctx.beginPath();ctx.ellipse(0,20,9,5,0,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.restore()
  }
  // Body
  ctx.fillStyle='#5DC264';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(bx+16,by+38,17,15,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Bow tie
  for(const[sx,flip] of[[-1,-1],[1,1]] as [number,number][]){
    ctx.save();ctx.translate(bx+16,by+50);ctx.scale(flip,1)
    ctx.fillStyle='#E63946';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(8,-4);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()
  }
  ctx.fillStyle='#C62828';ctx.beginPath();ctx.arc(bx+16,by+50,3.5,0,Math.PI*2);ctx.fill()
  // Eye stalks
  ctx.fillStyle='#5DC264';ctx.lineWidth=2
  for(const ex of[8,24]){ctx.beginPath();ctx.ellipse(bx+ex,by+17,8,8,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  // Head
  ctx.fillStyle='#5DC264';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(bx+16,by+27,19,17,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Eyes
  for(const[ex,epx] of[[8,9],[24,25]] as [number,number][]){
    ctx.fillStyle='white';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx+ex,by+17,6.5,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.fillStyle='#1A0800';ctx.beginPath();ctx.arc(bx+epx,by+16,3.5,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='white';ctx.beginPath();ctx.arc(bx+epx+1,by+15,1.2,0,Math.PI*2);ctx.fill()
  }
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx+16,by+30,7,0.15,Math.PI-0.15);ctx.stroke()
  if(p.invincible>0&&Math.floor(p.invincible/4)%2===0){ctx.fillStyle='rgba(255,80,80,0.45)';ctx.beginPath();ctx.ellipse(bx+16,by+36,22,32,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

// ── Projectile drawing ─────────────────────────────────────────────────────────
function drawProjs(ctx: CanvasRenderingContext2D, projs: Proj[], bossId: string) {
  for(const pr of projs) {
    if(pr.type==='pbullet'){
      // Player bullet — yellow pellet
      ctx.fillStyle='#FFCD00';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
      ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r,0,Math.PI*2);ctx.fill();ctx.stroke()
      ctx.fillStyle='rgba(255,205,0,0.4)';ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r+4,0,Math.PI*2);ctx.fill()
    } else if(pr.type==='coin'){
      ctx.fillStyle='#FFCD00';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
      ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r,0,Math.PI*2);ctx.fill();ctx.stroke()
      ctx.fillStyle='#1A0800';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('₿',pr.x,pr.y+3);ctx.textAlign='left'
    } else if(pr.type==='bill'){
      ctx.save();ctx.translate(pr.x,pr.y);ctx.rotate(Math.atan2(pr.vy,pr.vx))
      ctx.fillStyle='#85C17E';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
      ctx.beginPath();ctx.roundRect(-12,-6,24,12,2);ctx.fill();ctx.stroke()
      ctx.fillStyle='#1A0800';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('$',0,3);ctx.textAlign='left'
      ctx.restore()
    } else if(pr.type==='bomb') {
      if(pr.exploded){
        const a=Math.min(1,(pr.exT||0)/6)
        ctx.fillStyle=`rgba(255,120,30,${0.8*(1-a)})`;ctx.beginPath();ctx.arc(pr.x,pr.y,pr.exR||0,0,Math.PI*2);ctx.fill()
        ctx.fillStyle=`rgba(255,200,50,${0.6*(1-a)})`;ctx.beginPath();ctx.arc(pr.x,pr.y,(pr.exR||0)*0.6,0,Math.PI*2);ctx.fill()
      } else {
        ctx.fillStyle=bossId==='hacker'?'#00FF64':'#8B4513';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
        ctx.beginPath();ctx.arc(pr.x,pr.y,pr.r,0,Math.PI*2);ctx.fill();ctx.stroke()
        ctx.fillStyle='#FFD700';ctx.font='10px sans-serif';ctx.textAlign='center'
        ctx.fillText(bossId==='hacker'?'⚠':'$',pr.x,pr.y+3);ctx.textAlign='left'
        // fuse
        ctx.strokeStyle='#FF6B00';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pr.x,pr.y-pr.r);ctx.lineTo(pr.x+4,pr.y-pr.r-8);ctx.stroke()
      }
    } else if(pr.type==='code'){
      ctx.save();ctx.translate(pr.x,pr.y);ctx.rotate((pr.angle||0))
      ctx.fillStyle='rgba(0,255,100,0.9)';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
      ctx.beginPath();ctx.roundRect(-10,-8,20,16,3);ctx.fill();ctx.stroke()
      ctx.fillStyle='#1A0800';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText('0x?',0,3);ctx.textAlign='left'
      ctx.restore()
    } else if(pr.type==='shockwave'){
      ctx.strokeStyle='#FF7B25';ctx.lineWidth=6;ctx.globalAlpha=pr.life/60
      ctx.beginPath();ctx.moveTo(pr.x-pr.r,GY-4);ctx.lineTo(pr.x+pr.r,GY-4);ctx.stroke()
      ctx.globalAlpha=1
    } else if(pr.type==='laser'){
      const lp=pr.lPhase
      if(lp==='warn'){
        ctx.strokeStyle=`rgba(255,50,50,${0.4+Math.sin(Date.now()*0.01)*0.3})`;ctx.lineWidth=2;ctx.setLineDash([10,6])
        ctx.beginPath();ctx.moveTo(0,pr.ly??pr.y);ctx.lineTo(W,pr.ly??pr.y);ctx.stroke();ctx.setLineDash([])
        ctx.fillStyle='rgba(255,50,50,0.15)';ctx.fillRect(0,(pr.ly??pr.y)-15,W,30)
      } else {
        ctx.fillStyle='rgba(255,180,0,0.9)';ctx.fillRect(0,(pr.ly??pr.y)-14,W,28)
        ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillRect(0,(pr.ly??pr.y)-6,W,12)
        ctx.shadowColor='#FFCD00';ctx.shadowBlur=20;ctx.fillStyle='rgba(255,205,0,0.6)';ctx.fillRect(0,(pr.ly??pr.y)-20,W,40);ctx.shadowBlur=0
      }
    } else if(pr.type==='firewall'){
      const lp=pr.lPhase, fx=pr.lx??pr.x
      if(lp==='warn'){
        ctx.strokeStyle=`rgba(255,0,100,${0.5+Math.sin(Date.now()*0.015)*0.4})`;ctx.lineWidth=3;ctx.setLineDash([8,5])
        ctx.beginPath();ctx.moveTo(fx+12,0);ctx.lineTo(fx+12,H);ctx.stroke();ctx.setLineDash([])
      } else {
        ctx.fillStyle='rgba(255,0,80,0.85)';ctx.fillRect(fx,0,pr.lw??25,H)
        ctx.fillStyle='rgba(255,200,200,0.7)';ctx.fillRect(fx+6,0,6,H)
        ctx.shadowColor='#FF0050';ctx.shadowBlur=18;ctx.fillStyle='rgba(255,0,80,0.4)';ctx.fillRect(fx-8,0,(pr.lw??25)+16,H);ctx.shadowBlur=0
      }
    }
  }
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,H-46,130,32,10);ctx.fill();ctx.stroke()
  for(let i=0;i<3;i++){ctx.fillStyle=player.hp>i?'#E63946':'#333';ctx.font='22px sans-serif';ctx.fillText('♥',20+i*42,H-24)}
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,H-82,200,32,10);ctx.fill();ctx.stroke()
  ctx.fillStyle='#FFCD00';ctx.font="13px 'Fredoka One',cursive"
  ctx.fillText('Z/X: Shoot  ←→: Move  ↑: Jump',20,H-60)
}

// ── Boss AI ────────────────────────────────────────────────────────────────────
let _pid = 0
function mkProj(p: Omit<Proj,'id'>): Proj { return {...p, id:_pid++} }

function bossAct(gs: GS, bossData: typeof BOSSES[0]) {
  const {boss, player, projs} = gs
  boss.aTick++
  if(boss.hitFlash>0) boss.hitFlash--
  boss.stateTimer--
  const ratio = boss.hp/boss.maxHp
  boss.phase = ratio<0.33 ? 2 : ratio<0.67 ? 1 : 0

  // Gravity
  boss.vy = Math.min(boss.vy+0.45, 14)
  boss.y += boss.vy
  if(boss.y>=GY-BOSS_HALF){boss.y=GY-BOSS_HALF;boss.vy=0;boss.onGround=true}
  boss.x += boss.vx
  boss.x = Math.max(80, Math.min(boss.x, W-80))
  if(boss.x<=80||boss.x>=W-80) boss.vx*=-1

  const spd = 1.4 + boss.phase * 0.9
  boss.facingRight = player.x > boss.x

  // State selection when timer expires
  if(boss.stateTimer<=0) {
    const id=bossData.id, r=Math.random(), ph=boss.phase
    if(id==='landlord'){
      if(r<0.28){boss.state='patrol';boss.stateTimer=80+Math.random()*60;boss.vx=spd*(r>0.14?1:-1)}
      else if(r<0.50){boss.state='atk_bomb';boss.stateTimer=70+(ph===0?20:0)}
      else if(r<0.70){boss.state='atk_spread';boss.stateTimer=55}
      else if(r<0.88){boss.state='jump_stomp';boss.stateTimer=60;if(boss.onGround)boss.vy=-13}
      else{boss.state='charge';boss.stateTimer=38;boss.vx=(player.x>boss.x?1:-1)*(5+ph*2)}
    } else if(id==='cryptobro'){
      if(r<0.22){boss.state='drift';boss.stateTimer=70;boss.vx=spd*(r>0.11?1:-1)}
      else if(r<0.48){boss.state='atk_coins';boss.stateTimer=55}
      else if(r<0.68){boss.state='atk_laser';boss.stateTimer=90}
      else if(r<0.84){boss.state='charge';boss.stateTimer=40;boss.vx=(player.x>boss.x?1:-1)*(6+ph*2)}
      else{boss.state='jump_scatter';boss.stateTimer=60;if(boss.onGround)boss.vy=-14}
    } else {
      if(r<0.18){boss.state='patrol';boss.stateTimer=55;boss.vx=spd*(r>0.09?1:-1)}
      else if(r<0.40){boss.state='atk_code';boss.stateTimer=80}
      else if(r<0.60){boss.state='atk_virus';boss.stateTimer=65}
      else if(r<0.78){boss.state='atk_firewall';boss.stateTimer=100;boss.vx=0}
      else{boss.state='teleport';boss.stateTimer=45;boss.x=player.x>W/2?120:W-120;boss.vx=0}
    }
  }

  // Action execution — spawn projectiles at specific ticks
  const t = boss.stateTimer
  if(boss.state==='charge'||boss.state==='drift') {
    boss.x += boss.vx * 0.5 // extra push during charge
  }

  if(boss.state==='atk_bomb'&&(t===55||((boss.phase>=1)&&t===35)||(boss.phase>=2&&t===20))) {
    const count=boss.phase>=2?3:boss.phase>=1?2:1
    for(let i=0;i<count;i++){
      projs.push(mkProj({x:boss.x+(i-Math.floor(count/2))*35, y:boss.y-55, vx:(Math.random()-0.5)*4, vy:-9+Math.random()*2, type:'bomb', life:240, r:13, owner:'b', exploded:false, exT:0, exR:0, exMax:55}))
    }
  }
  if(boss.state==='atk_spread'&&t===40) {
    const count=boss.phase>=1?5:3
    for(let i=0;i<count;i++){
      const a=Math.atan2(player.y-boss.y,player.x-boss.x)+(i/(count-1)-0.5)*1.3
      projs.push(mkProj({x:boss.x,y:boss.y-30,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,type:'bill',life:80,r:8,owner:'b'}))
    }
  }
  if(boss.state==='jump_stomp'&&boss.onGround&&boss.stateTimer>25) {
    for(const dir of[-1,1] as const) projs.push(mkProj({x:boss.x,y:GY-6,vx:dir*7,vy:0,type:'shockwave',life:55,r:16,owner:'b',dir}))
    boss.state='patrol';boss.stateTimer=80
  }
  if(boss.state==='atk_coins'&&(t===45||(boss.phase>=1&&t===25))) {
    const count=boss.phase>=2?14:boss.phase>=1?10:6
    for(let i=0;i<count;i++){
      const a=(i/count)*Math.PI*2; projs.push(mkProj({x:boss.x,y:boss.y-30,vx:Math.cos(a)*5,vy:Math.sin(a)*5,type:'coin',life:75,r:9,owner:'b'}))
    }
  }
  if(boss.state==='atk_laser'&&t===70) {
    const ys=boss.phase>=2?[GY-50,GY-140]:[GY-50]
    for(const ly of ys) projs.push(mkProj({x:0,y:ly,vx:0,vy:0,type:'laser',life:90,r:0,owner:'b',ly,lPhase:'warn',lTimer:60}))
  }
  if(boss.state==='jump_scatter'&&boss.stateTimer===30) {
    const count=3+boss.phase
    for(let i=0;i<count;i++) projs.push(mkProj({x:boss.x+(i-Math.floor(count/2))*50,y:boss.y-50,vx:(i-Math.floor(count/2))*1.8,vy:-8,type:'coin',life:80,r:9,owner:'b'}))
  }
  if(boss.state==='atk_code'&&(t===65||(boss.phase>=1&&t===40)||(boss.phase>=2&&t===20))) {
    const count=boss.phase>=2?4:boss.phase>=1?3:2
    for(let i=0;i<count;i++){
      const a=Math.atan2(player.y-boss.y,player.x-boss.x)+(i/(count-1||1)-0.5)*0.8
      projs.push(mkProj({x:boss.x,y:boss.y-35,vx:Math.cos(a)*3.5,vy:Math.sin(a)*3.5,type:'code',life:130,r:11,owner:'b',angle:a,homing:boss.phase>=1}))
    }
  }
  if(boss.state==='atk_virus'&&(t===55||(boss.phase>=1&&t===30))) {
    const count=boss.phase>=2?4:boss.phase>=1?3:2
    for(let i=0;i<count;i++) projs.push(mkProj({x:boss.x+(i-Math.floor(count/2))*50,y:boss.y-60,vx:(i-Math.floor(count/2))*1.5,vy:-7+Math.random(),type:'bomb',life:200,r:12,owner:'b',exploded:false,exT:0,exR:0,exMax:65}))
  }
  if(boss.state==='atk_firewall'&&t===80) {
    const startX=boss.facingRight?-30:W+10, vx=boss.facingRight?4:-4
    projs.push(mkProj({x:startX,y:0,vx,vy:0,type:'firewall',life:130,r:0,owner:'b',lx:startX,ly:0,lw:28,lh:H,lPhase:'warn',lTimer:40}))
  }
}

function updateProjs(projs: Proj[], player: Player): Proj[] {
  const kept: Proj[] = []
  for(const pr of projs) {
    pr.life--
    if(pr.life<=0 && !pr.exploded) continue

    if(pr.type==='bomb') {
      if(!pr.exploded){
        pr.vy = Math.min((pr.vy||0)+GRAV, 16); pr.y+=pr.vy; pr.x+=pr.vx
        if(pr.y>=GY-pr.r){pr.exploded=true;pr.exT=0;pr.exR=0;pr.y=GY-pr.r;pr.vx=0;pr.vy=0}
      } else {
        pr.exT=(pr.exT||0)+1; pr.exR=Math.min((pr.exR||0)+(pr.exMax||50)/6,pr.exMax||50)
        if(pr.exT>14) {pr.life=0; continue}
      }
    } else if(pr.type==='shockwave') {
      pr.x += (pr.vx||0); pr.r = Math.min(pr.r+4, 80)
    } else if(pr.type==='laser') {
      if(pr.lPhase==='warn'){pr.lTimer=(pr.lTimer||60)-1;if((pr.lTimer||0)<=0){pr.lPhase='fire';pr.lTimer=28}}
      else{pr.lTimer=(pr.lTimer||0)-1;if((pr.lTimer||0)<=0){pr.life=0;continue}}
    } else if(pr.type==='firewall') {
      pr.x+=pr.vx; pr.lx=(pr.lx||0)+pr.vx
      if(pr.lPhase==='warn'){pr.lTimer=(pr.lTimer||40)-1;if((pr.lTimer||0)<=0){pr.lPhase='fire'}}
      if(pr.x<-50||pr.x>W+50){pr.life=0;continue}
    } else if(pr.type==='code'&&pr.homing) {
      // Gentle homing toward player
      const dx=player.x-pr.x, dy=player.y-pr.y, d=Math.sqrt(dx*dx+dy*dy)||1
      pr.vx+=dx/d*0.12; pr.vy+=dy/d*0.12
      const sp=Math.sqrt(pr.vx*pr.vx+pr.vy*pr.vy); if(sp>5){pr.vx=pr.vx/sp*5;pr.vy=pr.vy/sp*5}
      pr.x+=pr.vx; pr.y+=pr.vy; pr.angle=Math.atan2(pr.vy,pr.vx)
    } else {
      pr.x+=pr.vx; pr.y+=pr.vy
    }
    kept.push(pr)
  }
  return kept
}

function checkHits(gs: GS): boolean {
  const {player, boss, projs, bossIdx} = gs
  const bossData = BOSSES[bossIdx]
  let bossKilled = false

  for(const pr of projs) {
    if(pr.owner==='p') {
      // Player bullet vs boss
      const dx=pr.x-boss.x, dy=pr.y-(boss.y-20)
      if(Math.abs(dx)<55&&Math.abs(dy)<65) {
        pr.life=0; boss.hp-=1; boss.hitFlash=12
        if(boss.hp<=0){boss.hp=0;bossKilled=true}
      }
    } else if(pr.owner==='b'&&player.invincible<=0) {
      // Boss proj vs player
      let hit=false
      const px=player.x+16, py=player.y+30
      if(pr.type==='laser'&&pr.lPhase==='fire'){
        const ly=pr.ly??pr.y; if(Math.abs(py-ly)<22) hit=true
      } else if(pr.type==='firewall'&&pr.lPhase==='fire'){
        const fx=pr.lx??pr.x; if(px>fx&&px<fx+(pr.lw??25)) hit=true
      } else if(pr.type==='bomb'&&pr.exploded) {
        const dx=px-pr.x, dy=py-pr.y
        if(Math.sqrt(dx*dx+dy*dy)<(pr.exR||0)*0.8) hit=true
      } else if(pr.type!=='laser'&&pr.type!=='firewall') {
        const dx=px-pr.x, dy=py-pr.y
        if(Math.sqrt(dx*dx+dy*dy)<pr.r+14) hit=true
      }
      if(hit){player.hp=Math.max(0,player.hp-1);player.invincible=70;pr.life=0}
    }
  }
  return bossKilled
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function EpisodeNew() {
  const navigate = useNavigate()
  const cvs  = useRef<HTMLCanvasElement>(null)
  const raf  = useRef(0)
  const keys = useRef({left:false,right:false,up:false,shoot:false})

  const initGS = useCallback((bossIdx=0): GS => ({
    player: {x:80,y:GY-60,vx:0,vy:0,onGround:true,facingRight:true,hp:3,invincible:0,fireCd:0,wFrame:0,wTick:0},
    boss:   {x:W-160,y:GY-BOSS_HALF,vx:-1.5,vy:0,hp:BOSSES[bossIdx].maxHp,maxHp:BOSSES[bossIdx].maxHp,phase:0,facingRight:false,onGround:true,state:'patrol',stateTimer:80,hitFlash:0,aTick:0},
    bossIdx, projs:[], gp:'intro', tick:0, introT:160, stars:0, xp:0, pid:0,
  }), [])

  const gsRef = useRef<GS>(initGS(0))
  const [gp,      setGp]      = useState<GP>('intro')
  const [bossIdx, setBossIdx] = useState(0)
  const [quizRes, setQuizRes] = useState<{ok:boolean;why:string}|null>(null)
  const [hpDisp,  setHpDisp]  = useState(3)
  const [xpDisp,  setXpDisp]  = useState(0)
  const [quizIn,  setQuizIn]  = useState(false)

  useEffect(() => {
    const dn = (e:KeyboardEvent) => {
      if(e.key==='ArrowLeft'||e.key==='a') keys.current.left=true
      if(e.key==='ArrowRight'||e.key==='d') keys.current.right=true
      if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.current.up=true
      if(e.key==='z'||e.key==='Z'||e.key==='x'||e.key==='X') keys.current.shoot=true
      if(e.key===' ') e.preventDefault()
    }
    const up = (e:KeyboardEvent) => {
      if(e.key==='ArrowLeft'||e.key==='a') keys.current.left=false
      if(e.key==='ArrowRight'||e.key==='d') keys.current.right=false
      if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.current.up=false
      if(e.key==='z'||e.key==='Z'||e.key==='x'||e.key==='X') keys.current.shoot=false
    }
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up)}
  },[])

  useEffect(()=>{
    const canvas=cvs.current; if(!canvas) return
    const ctx=canvas.getContext('2d')!
    function tick(){
      const gs=gsRef.current; const k=keys.current; gs.tick++
      const bd=BOSSES[gs.bossIdx]; const plats=ARENA_PLATS[gs.bossIdx]
      const p=gs.player; const b=gs.boss

      // Intro countdown
      if(gs.gp==='intro'){ gs.introT--; if(gs.introT<=0){gs.gp='fight';setGp('fight')} }

      if(gs.gp==='fight'){
        // Player movement
        if(k.left){p.vx=-P_SPD;p.facingRight=false}
        else if(k.right){p.vx=P_SPD;p.facingRight=true}
        else p.vx*=0.72
        if(k.up&&p.onGround){p.vy=JUMP_VEL;p.onGround=false;k.up=false}
        // Shooting
        if(p.fireCd>0) p.fireCd--
        if(k.shoot&&p.fireCd<=0){
          p.fireCd=FIRE_RATE
          gs.projs.push(mkProj({x:p.x+(p.facingRight?36:0),y:p.y+25,vx:(p.facingRight?BULLET_SPEED:-BULLET_SPEED),vy:0,type:'pbullet',life:60,r:6,owner:'p'}))
        }
        // Physics
        p.vy=Math.min(p.vy+GRAV,18); p.y+=p.vy; p.x+=p.vx
        p.x=Math.max(10,Math.min(p.x,W-40))
        p.onGround=false
        if(p.y>=GY-60){p.y=GY-60;p.vy=0;p.onGround=true}
        if(p.vy>=0) for(const pl of plats) if(p.x+28>pl.x&&p.x+4<pl.x+pl.w&&p.y+60>pl.y&&p.y+60<pl.y+pl.h+14){p.y=pl.y-60;p.vy=0;p.onGround=true}
        if(Math.abs(p.vx)>0.4){if(++p.wTick>=6){p.wTick=0;p.wFrame=(p.wFrame+1)%6}}
        if(p.invincible>0) p.invincible--

        // Boss AI
        bossAct(gs,bd)
        // Update projectiles
        gs.projs=updateProjs(gs.projs,p)
        // Collision
        const killed=checkHits(gs)
        setHpDisp(p.hp)
        if(p.hp<=0){gs.gp='lost';setGp('lost')}
        else if(killed){gs.gp='quiz';setGp('quiz');setQuizIn(false);requestAnimationFrame(()=>setQuizIn(true))}
      }

      // Always render
      ctx.clearRect(0,0,W,H)
      drawArena(ctx,bd.id,gs.tick)
      for(const pl of plats) drawPlat(ctx,pl,bd.id)
      drawProjs(ctx,gs.projs,bd.id)
      if(gs.gp!=='bossdie') {
        if(bd.id==='landlord') drawBossLandlord(ctx,b,gs.tick)
        else if(bd.id==='cryptobro') drawBossCrypto(ctx,b,gs.tick)
        else drawBossHacker(ctx,b,gs.tick)
        drawBossHP(ctx,b,bd)
      }
      drawPlayer(ctx,p,gs.tick)
      drawHUD(ctx,p)
      // Scanlines
      for(let y=0;y<H;y+=3){ctx.fillStyle='rgba(0,0,0,0.02)';ctx.fillRect(0,y,W,1)}
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.85)
      vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(0,0,0,0.4)')
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)

      raf.current=requestAnimationFrame(tick)
    }
    raf.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf.current)
  },[])

  const handleChoice = useCallback((idx:number)=>{
    if(quizRes) return
    const bd=BOSSES[gsRef.current.bossIdx]
    const ch=bd.quiz.choices[idx]
    setQuizRes({ok:ch.ok,why:ch.why})
    if(ch.ok){
      gsRef.current.xp+=150; setXpDisp(gsRef.current.xp)
    } else {
      gsRef.current.boss.hp=Math.min(gsRef.current.boss.maxHp, gsRef.current.boss.hp+5)
      gsRef.current.player.hp=Math.max(0,gsRef.current.player.hp-1)
      setHpDisp(gsRef.current.player.hp)
    }
  },[quizRes])

  const handleQuizContinue = useCallback(()=>{
    const gs=gsRef.current
    if(!quizRes) return
    if(quizRes.ok){
      const next=gs.bossIdx+1
      if(next>=BOSSES.length){gs.gp='win';setGp('win')}
      else{
        gsRef.current=initGS(next)
        gsRef.current.gp='intro'; gsRef.current.introT=160; gsRef.current.xp=gs.xp
        setBossIdx(next); setGp('intro'); setHpDisp(3)
      }
    } else {
      if(gs.player.hp<=0){gs.gp='lost';setGp('lost')}
      else{gs.gp='fight';setGp('fight')}
    }
    setQuizRes(null); setQuizIn(false)
  },[quizRes,initGS])

  const touchKey=(k:keyof typeof keys.current,v:boolean)=>{keys.current[k]=v}

  const BULLET_SPEED = 9

  return (
    <div style={{width:'100vw',height:'100vh',background:'#080508',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',fontFamily:"'Fredoka Variable',sans-serif"}}>
      <div style={{position:'relative',border:'4px solid #1A0800',borderRadius:'10px',boxShadow:'0 0 0 3px #FFCD00,0 0 0 6px #1A0800,12px 12px 40px rgba(0,0,0,0.9)'}}>
        <canvas ref={cvs} width={W} height={H} style={{display:'block'}}/>

        {/* Boss intro card */}
        {gp==='intro'&&(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{textAlign:'center',animation:'slam 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',letterSpacing:'0.25em',color:'#FFCD00',marginBottom:6,opacity:0.8}}>BOSS {bossIdx+1} / {BOSSES.length}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'3.5rem',lineHeight:1,color:'white',textShadow:'4px 4px 0 #1A0800, 6px 6px 0 '+BOSSES[bossIdx].col,marginBottom:8}}>{BOSSES[bossIdx].name}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1rem',color:BOSSES[bossIdx].col,textShadow:'2px 2px 0 #1A0800'}}>{BOSSES[bossIdx].sub}</div>
            </div>
          </div>
        )}

        {/* Quiz overlay */}
        {gp==='quiz'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:22,padding:'28px 32px',maxWidth:460,width:'100%',boxShadow:'8px 8px 0 #1A0800',transform:quizIn?'scale(1) translateY(0)':'scale(0.85) translateY(20px)',opacity:quizIn?1:0,transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s'}}>
              <div style={{textAlign:'center',marginBottom:14}}>
                <span style={{background:BOSSES[bossIdx].col,color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.65rem',letterSpacing:'0.14em',padding:'3px 14px',borderRadius:9999,border:'2px solid #1A0800',boxShadow:'2px 2px 0 #1A0800'}}>⚡ FINAL BLOW — ANSWER TO WIN!</span>
              </div>
              <p style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.05rem',lineHeight:1.35,textAlign:'center',marginBottom:18,color:'#1A0800'}}>{BOSSES[bossIdx].quiz.q}</p>
              {!quizRes?(
                <div style={{display:'flex',flexDirection:'column',gap:9}}>
                  {BOSSES[bossIdx].quiz.choices.map((ch,i)=>(
                    <button key={i} onClick={()=>handleChoice(i)} style={{padding:'11px 18px',border:'3px solid #1A0800',borderRadius:14,background:'white',fontFamily:"'Fredoka Variable',sans-serif",fontWeight:600,fontSize:'0.88rem',cursor:'pointer',textAlign:'left',boxShadow:'3px 3px 0 #1A0800',transition:'transform 0.1s,box-shadow 0.1s',lineHeight:1.35}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='5px 5px 0 #1A0800'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='3px 3px 0 #1A0800'}}
                    >{ch.t}</button>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'3rem',marginBottom:6}}>{quizRes.ok?'🎉':'😬'}</div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.2rem',color:quizRes.ok?'#2D9A4E':'#E63946',marginBottom:6}}>{quizRes.ok?`Boss defeated! +150 XP`:`Wrong! Boss heals 5 HP. −1 HP`}</div>
                  <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.88rem',color:'#555',marginBottom:18,lineHeight:1.55}}>{quizRes.why}</p>
                  <button onClick={handleQuizContinue} style={{padding:'12px 36px',border:'3px solid #1A0800',borderRadius:9999,background:quizRes.ok?'#FFCD00':'#E63946',color:'#1A0800',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>
                    {quizRes.ok?(bossIdx+1>=BOSSES.length?'Finish! 🏆':'Next Boss! →'):(hpDisp<=0?'Game Over...':'Keep Fighting! →')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Win */}
        {gp==='win'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:26,padding:44,textAlign:'center',boxShadow:'8px 8px 0 #1A0800'}}>
              <div style={{fontSize:'4rem',marginBottom:10}}>🏆</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:8,color:'#1A0800'}}>Boss Rush Complete!</h2>
              <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:14}}>{[0,1,2].map(i=><span key={i} style={{fontSize:'2.4rem',opacity:xpDisp>i*150?1:0.25}}>⭐</span>)}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.5rem',background:'#1A0800',color:'#FFCD00',borderRadius:14,padding:'10px 28px',marginBottom:24,display:'inline-block'}}>{xpDisp} XP</div>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initGS(0);setBossIdx(0);setGp('intro');setHpDisp(3);setXpDisp(0);setQuizRes(null)}} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:9999,background:'#FFCD00',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>Play Again</button>
                <button onClick={()=>navigate('/')} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:9999,background:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>← Home</button>
              </div>
            </div>
          </div>
        )}

        {/* Lost */}
        {gp==='lost'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#1A0800',border:'4px solid #E63946',borderRadius:26,padding:44,textAlign:'center',boxShadow:'8px 8px 0 #E63946'}}>
              <div style={{fontSize:'4rem',marginBottom:10}}>💀</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:8,color:'#E63946'}}>Game Over!</h2>
              <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.95rem',color:'rgba(255,255,255,0.7)',marginBottom:24,lineHeight:1.5}}>You ran out of HP.<br/>Study up and try again!</p>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initGS(0);setBossIdx(0);setGp('intro');setHpDisp(3);setXpDisp(0);setQuizRes(null)}} style={{padding:'13px 28px',border:'3px solid #E63946',borderRadius:9999,background:'#E63946',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #C62828'}}>Try Again</button>
                <button onClick={()=>navigate('/')} style={{padding:'13px 28px',border:'3px solid #555',borderRadius:9999,background:'#333',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #111'}}>← Home</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
        {(['left','right'] as const).map(d=>(
          <button key={d} onPointerDown={()=>touchKey(d,true)} onPointerUp={()=>touchKey(d,false)} onPointerLeave={()=>touchKey(d,false)}
            style={{width:54,height:54,border:'3px solid #FFCD00',borderRadius:14,background:'rgba(255,205,0,0.12)',color:'#FFCD00',fontSize:'1.4rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {d==='left'?'◀':'▶'}</button>
        ))}
        <button onPointerDown={()=>touchKey('up',true)} onPointerUp={()=>touchKey('up',false)} onPointerLeave={()=>touchKey('up',false)}
          style={{width:54,height:54,border:'3px solid #5DC264',borderRadius:9999,background:'rgba(93,194,100,0.12)',color:'#5DC264',fontSize:'1.6rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>↑</button>
        <button onPointerDown={()=>touchKey('shoot',true)} onPointerUp={()=>touchKey('shoot',false)} onPointerLeave={()=>touchKey('shoot',false)}
          style={{width:54,height:54,border:'3px solid #FFCD00',borderRadius:14,background:'rgba(255,205,0,0.2)',color:'#FFCD00',fontFamily:"'Fredoka One',cursive",fontSize:'1rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
          SHOOT</button>
      </div>
      <button onClick={()=>navigate('/')} style={{marginTop:8,background:'transparent',border:'none',color:'rgba(255,205,0,0.4)',fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',cursor:'pointer',letterSpacing:'0.12em'}}>← BACK</button>
    </div>
  )
}
