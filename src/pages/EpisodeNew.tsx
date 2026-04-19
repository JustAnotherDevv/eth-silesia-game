import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Shared constants ───────────────────────────────────────────────────────────
const W = 800, H = 480
const GRAV        = 0.52
const P_SPD       = 3.8
const JUMP_VEL    = -13
const GY          = H - 72
const FIRE_RATE   = 10
const BOSS_HALF   = 60
const BULLET_SPEED = 9

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD 1 — BOSS RUSH ARENA
// ═══════════════════════════════════════════════════════════════════════════════

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

interface Player { x:number; y:number; vx:number; vy:number; onGround:boolean; facingRight:boolean; hp:number; invincible:number; fireCd:number; wFrame:number; wTick:number }
interface Boss   { x:number; y:number; vx:number; vy:number; hp:number; maxHp:number; phase:number; facingRight:boolean; onGround:boolean; state:string; stateTimer:number; hitFlash:number; aTick:number }
interface Proj   { id:number; x:number; y:number; vx:number; vy:number; type:string; life:number; r:number; owner:'p'|'b'; exploded?:boolean; exT?:number; exR?:number; exMax?:number; lPhase?:'warn'|'fire'; lTimer?:number; lx?:number; ly?:number; lw?:number; lh?:number; dir?:number; homing?:boolean; angle?:number }
type GP = 'intro'|'fight'|'quiz'|'bossdie'|'win'|'lost'
interface GS { player:Player; boss:Boss; bossIdx:number; projs:Proj[]; gp:GP; tick:number; introT:number; stars:number; xp:number; pid:number }

function drawArena(ctx: CanvasRenderingContext2D, id: string, tick: number) {
  if (id === 'landlord') {
    ctx.fillStyle = '#F5E6C8'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(180,120,60,0.08)'
    for (let y = 0; y < GY; y += 40) for (let x = (y/40)%2===0?0:20; x < W; x += 40) { ctx.fillRect(x, y, 18, 18) }
    ctx.fillStyle = '#8B4513'; ctx.fillRect(350, GY-180, 100, 180); ctx.strokeStyle='#1A0800'; ctx.lineWidth=3; ctx.strokeRect(350,GY-180,100,180)
    ctx.fillStyle = '#2C2C2C'; ctx.fillRect(360, GY-160, 80, 140)
    ctx.fillStyle = '#FF6B2B'; ctx.beginPath(); ctx.ellipse(400, GY-80, 25, 40, 0, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#FFCD00'; ctx.beginPath(); ctx.ellipse(400, GY-60, 15, 25, 0, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = 'rgba(45,154,78,0.3)'; ctx.font = "bold 40px 'Fredoka One',cursive"; ctx.textAlign='center'
    for (let i = 0; i < 6; i++) ctx.fillText('$', 60 + i*140, 80 + Math.sin(i)*20)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8B4513'; ctx.fillRect(0, GY, W, H-GY)
    ctx.fillStyle = '#A0522D'; for (let x=0;x<W;x+=60) ctx.fillRect(x,GY,58,10)
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke()
  } else if (id === 'cryptobro') {
    const sky = ctx.createLinearGradient(0,0,0,GY)
    sky.addColorStop(0,'#0D0528'); sky.addColorStop(1,'#1a0a3d')
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,GY)
    ctx.fillStyle='white'
    for (let i=0;i<60;i++) { const sx=(i*137)%W, sy=(i*91)%GY*0.7, pulse=Math.sin(tick*0.03+i)*0.5+0.5; ctx.globalAlpha=0.4+pulse*0.6; ctx.beginPath(); ctx.arc(sx,sy,1+pulse,0,Math.PI*2); ctx.fill() }
    ctx.globalAlpha=1
    ctx.fillStyle='#FFF8DC'; ctx.shadowColor='#FFF8DC'; ctx.shadowBlur=20
    ctx.beginPath(); ctx.arc(680,60,45,0,Math.PI*2); ctx.fill()
    ctx.shadowBlur=0
    ctx.fillStyle='#FFCD00'; ctx.font="bold 28px sans-serif"; ctx.textAlign='center'
    ctx.fillText('🌙',680,73); ctx.textAlign='left'
    const buildings = [[0,120,80],[100,160,90],[200,100,70],[320,180,100],[500,140,85],[620,110,75],[720,160,80]]
    ctx.fillStyle='#0D0528'
    for (const [bx,bh,bw] of buildings) { ctx.fillRect(bx,GY-bh,bw,bh); ctx.fillStyle='rgba(255,220,50,0.5)'; for(let wy=GY-bh+10;wy<GY-5;wy+=20) for(let wx=bx+6;wx<bx+bw-8;wx+=18) { if(Math.sin(wx*wy+tick*0.01)>0) ctx.fillRect(wx,wy,10,10) }; ctx.fillStyle='#0D0528' }
    ctx.fillStyle='rgba(255,205,0,0.2)'; ctx.font="40px sans-serif"; ctx.textAlign='center'
    for(let i=0;i<4;i++) ctx.fillText('₿',100+i*200,50+Math.sin(tick*0.04+i)*15)
    ctx.textAlign='left'
    ctx.fillStyle='#444'; ctx.fillRect(0,GY,W,H-GY)
    ctx.fillStyle='#555'; ctx.fillRect(0,GY,W,8)
    ctx.strokeStyle='#1A0800'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke()
  } else {
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H)
    ctx.fillStyle='rgba(0,255,100,0.12)'; ctx.font='12px monospace'
    for (let i=0;i<20;i++) { const col=(i*41+tick)%W, row=((tick*2+i*37)%(GY*1.5)); ctx.fillText(Math.random()>0.5?'1':'0',col,row) }
    ctx.strokeStyle='rgba(0,100,255,0.15)'; ctx.lineWidth=1
    for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,GY);ctx.stroke()}
    for(let y=0;y<GY;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    ctx.fillStyle='rgba(0,255,100,0.5)'
    for(let i=0;i<12;i++){const nx=(i*113)%W,ny=(i*79)%GY,pulse=Math.sin(tick*0.05+i)*0.5+0.5;ctx.beginPath();ctx.arc(nx,ny,3+pulse*4,0,Math.PI*2);ctx.fill()}
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
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0,85,45,10,0,0,Math.PI*2); ctx.fill()
  const legSwing = Math.sin(boss.aTick*0.1)*10
  for(const[ox,sw] of [[-20,1],[20,-1]] as [number,number][]) {
    ctx.fillStyle=fc; ctx.lineWidth=4
    ctx.save(); ctx.translate(ox,60); ctx.rotate(sw*legSwing*Math.PI/180)
    ctx.beginPath(); ctx.roundRect(-8,0,16,28,4); ctx.fill(); ctx.stroke()
    ctx.fillStyle='#1A0800'; ctx.beginPath(); ctx.ellipse(0,30,14,6,0,0,Math.PI*2); ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle=fc; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,42,38,32,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#E63946'; ctx.beginPath(); ctx.moveTo(-6,20); ctx.lineTo(0,50); ctx.lineTo(6,20); ctx.closePath(); ctx.fill(); ctx.stroke()
  const armSwing = Math.sin(boss.aTick*0.12)*20
  for(const[sx,dir] of [[-38,1],[38,-1]] as [number,number][]) {
    ctx.save(); ctx.translate(sx,30); ctx.rotate(dir*armSwing*Math.PI/180)
    ctx.fillStyle=fc; ctx.lineWidth=3
    ctx.beginPath(); ctx.ellipse(dir<0?-12:12,20,10,24,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
    ctx.restore()
  }
  ctx.fillStyle=hc; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,-5,36,32,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#1A0800'
  ctx.beginPath(); ctx.roundRect(-38,-44,76,10,3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-24,-80,48,38,4); ctx.fill()
  if(p2){ ctx.strokeStyle='#FF2200'; ctx.lineWidth=2; ctx.strokeRect(-24,-80,48,38) }
  if(p2) {
    ctx.strokeStyle='#1A0800'; ctx.lineWidth=3
    for(const ex of[-16,16]){ctx.beginPath();ctx.moveTo(ex-7,-15);ctx.lineTo(ex+7,-1);ctx.moveTo(ex+7,-15);ctx.lineTo(ex-7,-1);ctx.stroke()}
  } else {
    ctx.fillStyle='white'; ctx.lineWidth=1.5
    for(const ex of[-16,16]){ctx.beginPath();ctx.arc(ex,-8,10,0,Math.PI*2);ctx.fill();ctx.stroke()}
    ctx.fillStyle='#1C7D2E'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'
    ctx.fillText('$',-16,-4); ctx.fillText('$',16,-4); ctx.textAlign='left'
  }
  ctx.fillStyle='#FF8FA0'; ctx.lineWidth=2
  ctx.beginPath(); ctx.ellipse(0,8,14,10,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#C62828'
  ctx.beginPath(); ctx.arc(-6,8,3,0,Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(6,8,3,0,Math.PI*2); ctx.fill()
  if(boss.hitFlash>0){ ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/12})`; ctx.beginPath(); ctx.ellipse(0,20,50,65,0,0,Math.PI*2); ctx.fill() }
  ctx.restore()
}

function drawBossCrypto(ctx: CanvasRenderingContext2D, boss: Boss, tick: number) {
  const p2 = boss.phase>=2
  const float = Math.sin(tick*0.06)*8 + (boss.phase*5)
  const sc = 1+boss.phase*0.1
  const cx=boss.x, cy=boss.y-BOSS_HALF+float
  ctx.save(); ctx.translate(cx,cy); ctx.scale(boss.facingRight?sc:-sc,sc)
  if(p2){ ctx.fillStyle='rgba(123,45,139,0.25)'; ctx.beginPath(); ctx.arc(0,30,70,0,Math.PI*2); ctx.fill() }
  const shadowScale = 0.5+float*0.01; ctx.fillStyle='rgba(0,0,0,0.15)'
  ctx.beginPath(); ctx.ellipse(0,100,40*shadowScale,8*shadowScale,0,0,Math.PI*2); ctx.fill()
  ctx.strokeStyle='#1A0800'
  ctx.fillStyle= p2?'#9B3CB9':'#9B59B6'; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,45,34,30,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='22px sans-serif'; ctx.textAlign='center'
  ctx.fillText('🌙',0,56); ctx.textAlign='left'
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,45,34,30,0,0,Math.PI*2); ctx.stroke()
  const armSwing = Math.sin(boss.aTick*0.1)*25
  ctx.save(); ctx.translate(-34,36); ctx.rotate(-armSwing*Math.PI/180)
  ctx.fillStyle='#FDBCB4'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(-12,18,10,22,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.roundRect(-24,30,14,20,2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='rgba(0,255,136,0.9)'; ctx.font='7px monospace'; ctx.fillText('↑↑',-22,43)
  ctx.restore()
  ctx.save(); ctx.translate(34,36); ctx.rotate(armSwing*Math.PI/180)
  ctx.fillStyle='#FDBCB4'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(12,18,10,22,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.restore()
  ctx.fillStyle='#FDBCB4'; ctx.lineWidth=3
  ctx.beginPath(); ctx.ellipse(0,-4,28,26,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.fillStyle='#1A0800'
  for(let i=0;i<5;i++){const hx=-16+i*8;ctx.beginPath();ctx.moveTo(hx-4,-24);ctx.lineTo(hx,-36);ctx.lineTo(hx+4,-24);ctx.closePath();ctx.fill()}
  ctx.fillStyle = p2?'#7B2D8B':'#1A0800'
  ctx.beginPath(); ctx.roundRect(-24,-12,18,11,3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-1,-12,18,11,3); ctx.fill()
  ctx.strokeStyle='#666'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.moveTo(-6,-7); ctx.lineTo(-1,-7); ctx.stroke()
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=2
  for(const ex of[-30,17]){ctx.beginPath();ctx.moveTo(ex,-7);ctx.lineTo(ex<0?-24:35,-7);ctx.stroke()}
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
  if(p2){ctx.fillStyle='rgba(0,255,100,0.15)';ctx.beginPath();ctx.arc(0,30,75,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(0,92,42,10,0,0,Math.PI*2);ctx.fill()
  for(const ox of[-20,20]){
    ctx.fillStyle='#1E1E3F';ctx.lineWidth=4
    ctx.beginPath();ctx.roundRect(ox-7,62,14,28,3);ctx.fill();ctx.stroke()
    ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(ox,92,13,6,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  }
  ctx.fillStyle='#1E1E3F';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,42,34,30,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  const lapBob = Math.sin(tick*0.09)*5
  ctx.fillStyle='#2C2C54';ctx.lineWidth=2.5
  ctx.beginPath();ctx.roundRect(-24,22+lapBob,48,32,4);ctx.fill();ctx.stroke()
  ctx.fillStyle=p2?'#FF4400':'#00FF64'
  ctx.shadowColor=p2?'#FF4400':'#00FF64';ctx.shadowBlur=8
  ctx.font='7px monospace'
  for(let i=0;i<3;i++)ctx.fillText(['0x1F','NULL','ERR'][i],-20,32+i*8+lapBob)
  ctx.shadowBlur=0
  ctx.lineWidth=5;ctx.strokeStyle='#1E1E3F'
  ctx.beginPath();ctx.moveTo(-34,30);ctx.quadraticCurveTo(-48,50,-28,56);ctx.stroke()
  ctx.beginPath();ctx.moveTo(34,30);ctx.quadraticCurveTo(48,50,28,56);ctx.stroke()
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(-34,30);ctx.quadraticCurveTo(-48,50,-28,56);ctx.stroke()
  ctx.beginPath();ctx.moveTo(34,30);ctx.quadraticCurveTo(48,50,28,56);ctx.stroke()
  ctx.fillStyle='#FDBCB4';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,-4,26,24,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1E1E3F'
  ctx.beginPath();ctx.arc(0,-10,34,Math.PI+0.2,-0.2);ctx.lineTo(0,-18);ctx.closePath();ctx.fill();ctx.stroke()
  ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-18,-2,36,20,4);ctx.fill()
  ctx.fillStyle=p2?'#FF4400':'#00FF64'
  ctx.shadowColor=p2?'#FF4400':'#00FF64';ctx.shadowBlur=12
  ctx.beginPath();ctx.arc(-10,-10,5,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.arc(10,-10,5,0,Math.PI*2);ctx.fill()
  ctx.shadowBlur=0
  if(boss.hitFlash>0){ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/12})`;ctx.beginPath();ctx.ellipse(0,20,48,70,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, tick: number) {
  const bob = p.onGround && Math.abs(p.vx)>0.3 ? Math.sin(p.wFrame*Math.PI/3)*2.5 : 0
  const ls   = Math.sin(p.wFrame*Math.PI/3)*14
  const bx=p.x, by=p.y+bob
  ctx.save()
  if(!p.facingRight){ctx.translate(bx+16,0);ctx.scale(-1,1);ctx.translate(-(bx+16),0)}
  ctx.strokeStyle='#1A0800'
  for(const[ox,sw] of[[8,1],[24,-1]] as [number,number][]){
    ctx.save();ctx.translate(bx+ox,by+50);ctx.rotate(sw*ls*Math.PI/180)
    ctx.strokeStyle='#3A9E42';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.stroke()
    ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.stroke()
    ctx.fillStyle='#3A9E42';ctx.beginPath();ctx.ellipse(0,20,9,5,0,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.restore()
  }
  ctx.fillStyle='#5DC264';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(bx+16,by+38,17,15,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  for(const[sx,flip] of[[-1,-1],[1,1]] as [number,number][]){
    ctx.save();ctx.translate(bx+16,by+50);ctx.scale(flip,1)
    ctx.fillStyle='#E63946';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(8,-4);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()
  }
  ctx.fillStyle='#C62828';ctx.beginPath();ctx.arc(bx+16,by+50,3.5,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#5DC264';ctx.lineWidth=2
  for(const ex of[8,24]){ctx.beginPath();ctx.ellipse(bx+ex,by+17,8,8,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#5DC264';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(bx+16,by+27,19,17,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  for(const[ex,epx] of[[8,9],[24,25]] as [number,number][]){
    ctx.fillStyle='white';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx+ex,by+17,6.5,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.fillStyle='#1A0800';ctx.beginPath();ctx.arc(bx+epx,by+16,3.5,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='white';ctx.beginPath();ctx.arc(bx+epx+1,by+15,1.2,0,Math.PI*2);ctx.fill()
  }
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx+16,by+30,7,0.15,Math.PI-0.15);ctx.stroke()
  if(p.invincible>0&&Math.floor(p.invincible/4)%2===0){ctx.fillStyle='rgba(255,80,80,0.45)';ctx.beginPath();ctx.ellipse(bx+16,by+36,22,32,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

function drawProjs(ctx: CanvasRenderingContext2D, projs: Proj[], bossId: string) {
  for(const pr of projs) {
    if(pr.type==='pbullet'){
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

function drawHUD(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,H-46,130,32,10);ctx.fill();ctx.stroke()
  for(let i=0;i<3;i++){ctx.fillStyle=player.hp>i?'#E63946':'#333';ctx.font='22px sans-serif';ctx.fillText('♥',20+i*42,H-24)}
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,H-82,200,32,10);ctx.fill();ctx.stroke()
  ctx.fillStyle='#FFCD00';ctx.font="13px 'Fredoka One',cursive"
  ctx.fillText('Z/X: Shoot  ←→: Move  ↑: Jump',20,H-60)
}

let _pid = 0
function mkProj(p: Omit<Proj,'id'>): Proj { return {...p, id:_pid++} }

function bossAct(gs: GS, bossData: typeof BOSSES[0]) {
  const {boss, player, projs} = gs
  boss.aTick++
  if(boss.hitFlash>0) boss.hitFlash--
  boss.stateTimer--
  const ratio = boss.hp/boss.maxHp
  boss.phase = ratio<0.33 ? 2 : ratio<0.67 ? 1 : 0
  boss.vy = Math.min(boss.vy+0.45, 14)
  boss.y += boss.vy
  if(boss.y>=GY-BOSS_HALF){boss.y=GY-BOSS_HALF;boss.vy=0;boss.onGround=true}
  boss.x += boss.vx
  boss.x = Math.max(80, Math.min(boss.x, W-80))
  if(boss.x<=80||boss.x>=W-80) boss.vx*=-1
  const spd = 1.4 + boss.phase * 0.9
  boss.facingRight = player.x > boss.x
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
  const t = boss.stateTimer
  if(boss.state==='charge'||boss.state==='drift') { boss.x += boss.vx * 0.5 }
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
      const dx=pr.x-boss.x, dy=pr.y-(boss.y-20)
      if(Math.abs(dx)<55&&Math.abs(dy)<65) {
        pr.life=0; boss.hp-=1; boss.hitFlash=12
        if(boss.hp<=0){boss.hp=0;bossKilled=true}
      }
    } else if(pr.owner==='b'&&player.invincible<=0) {
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
  void bossData
  return bossKilled
}

// ── BossRush component ─────────────────────────────────────────────────────────
function BossRush({ onBack }: { onBack: () => void }) {
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
      if(gs.gp==='intro'){ gs.introT--; if(gs.introT<=0){gs.gp='fight';setGp('fight')} }
      if(gs.gp==='fight'){
        if(k.left){p.vx=-P_SPD;p.facingRight=false}
        else if(k.right){p.vx=P_SPD;p.facingRight=true}
        else p.vx*=0.72
        if(k.up&&p.onGround){p.vy=JUMP_VEL;p.onGround=false;k.up=false}
        if(p.fireCd>0) p.fireCd--
        if(k.shoot&&p.fireCd<=0){
          p.fireCd=FIRE_RATE
          gs.projs.push(mkProj({x:p.x+(p.facingRight?36:0),y:p.y+25,vx:(p.facingRight?BULLET_SPEED:-BULLET_SPEED),vy:0,type:'pbullet',life:60,r:6,owner:'p'}))
        }
        p.vy=Math.min(p.vy+GRAV,18); p.y+=p.vy; p.x+=p.vx
        p.x=Math.max(10,Math.min(p.x,W-40))
        p.onGround=false
        if(p.y>=GY-60){p.y=GY-60;p.vy=0;p.onGround=true}
        if(p.vy>=0) for(const pl of plats) if(p.x+28>pl.x&&p.x+4<pl.x+pl.w&&p.y+60>pl.y&&p.y+60<pl.y+pl.h+14){p.y=pl.y-60;p.vy=0;p.onGround=true}
        if(Math.abs(p.vx)>0.4){if(++p.wTick>=6){p.wTick=0;p.wFrame=(p.wFrame+1)%6}}
        if(p.invincible>0) p.invincible--
        bossAct(gs,bd)
        gs.projs=updateProjs(gs.projs,p)
        const killed=checkHits(gs)
        setHpDisp(p.hp)
        if(p.hp<=0){gs.gp='lost';setGp('lost')}
        else if(killed){gs.gp='quiz';setGp('quiz');setQuizIn(false);requestAnimationFrame(()=>setQuizIn(true))}
      }
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

  return (
    <div style={{width:'100vw',height:'100vh',background:'#080508',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',fontFamily:"'Fredoka Variable',sans-serif"}}>
      <div style={{position:'relative',border:'4px solid #1A0800',borderRadius:'10px',boxShadow:'0 0 0 3px #FFCD00,0 0 0 6px #1A0800,12px 12px 40px rgba(0,0,0,0.9)'}}>
        <canvas ref={cvs} width={W} height={H} style={{display:'block'}}/>
        {gp==='intro'&&(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{textAlign:'center',animation:'slam 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',letterSpacing:'0.25em',color:'#FFCD00',marginBottom:6,opacity:0.8}}>BOSS {bossIdx+1} / {BOSSES.length}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'3.5rem',lineHeight:1,color:'white',textShadow:'4px 4px 0 #1A0800, 6px 6px 0 '+BOSSES[bossIdx].col,marginBottom:8}}>{BOSSES[bossIdx].name}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1rem',color:BOSSES[bossIdx].col,textShadow:'2px 2px 0 #1A0800'}}>{BOSSES[bossIdx].sub}</div>
            </div>
          </div>
        )}
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
        {gp==='win'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:26,padding:44,textAlign:'center',boxShadow:'8px 8px 0 #1A0800'}}>
              <div style={{fontSize:'4rem',marginBottom:10}}>🏆</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:8,color:'#1A0800'}}>Boss Rush Complete!</h2>
              <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:14}}>{[0,1,2].map(i=><span key={i} style={{fontSize:'2.4rem',opacity:xpDisp>i*150?1:0.25}}>⭐</span>)}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.5rem',background:'#1A0800',color:'#FFCD00',borderRadius:14,padding:'10px 28px',marginBottom:24,display:'inline-block'}}>{xpDisp} XP</div>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initGS(0);setBossIdx(0);setGp('intro');setHpDisp(3);setXpDisp(0);setQuizRes(null)}} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:9999,background:'#FFCD00',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>Play Again</button>
                <button onClick={onBack} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:9999,background:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>← Back</button>
              </div>
            </div>
          </div>
        )}
        {gp==='lost'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#1A0800',border:'4px solid #E63946',borderRadius:26,padding:44,textAlign:'center',boxShadow:'8px 8px 0 #E63946'}}>
              <div style={{fontSize:'4rem',marginBottom:10}}>💀</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:8,color:'#E63946'}}>Game Over!</h2>
              <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.95rem',color:'rgba(255,255,255,0.7)',marginBottom:24,lineHeight:1.5}}>You ran out of HP.<br/>Study up and try again!</p>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initGS(0);setBossIdx(0);setGp('intro');setHpDisp(3);setXpDisp(0);setQuizRes(null)}} style={{padding:'13px 28px',border:'3px solid #E63946',borderRadius:9999,background:'#E63946',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #C62828'}}>Try Again</button>
                <button onClick={onBack} style={{padding:'13px 28px',border:'3px solid #555',borderRadius:9999,background:'#333',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #111'}}>← Back</button>
              </div>
            </div>
          </div>
        )}
      </div>
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
      <button onClick={onBack} style={{marginTop:8,background:'transparent',border:'none',color:'rgba(255,205,0,0.4)',fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',cursor:'pointer',letterSpacing:'0.12em'}}>← BACK</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD 2 — BOSS GAUNTLET (Scrolling Platformer)
// ═══════════════════════════════════════════════════════════════════════════════

const W2_ZONES = [
  { left: 600,  right: 1300, bossWx: 950  },
  { left: 2000, right: 2700, bossWx: 2350 },
  { left: 3400, right: 4100, bossWx: 3750 },
] as const

const W2_WIN_WX  = 4300
const W2_WORLD_W = 4600

const W2_BOSSES = [
  {
    id: 'inflation', name: 'INFLATION TITAN', sub: 'Ruler of Rising Prices',
    maxHp: 25, col: '#FF7B25',
    itemName: 'Price Truth Report', itemEmoji: '📊',
    quiz: {
      q: 'Inflation hits 8%. What best protects your savings?',
      choices: [
        { t: 'Leave it in a 0.5% savings account',          ok: false, why: 'Negative real return — inflation silently destroys savings.' },
        { t: 'Invest in index funds and inflation-linked bonds', ok: true, why: 'Correct! Diversified investment outpaces inflation long-term.' },
        { t: 'Convert everything to cash under the mattress', ok: false, why: 'Cash loses value fastest during inflation.' },
      ],
    },
  },
  {
    id: 'debt', name: 'DEBT SPIRAL', sub: 'Lord of Compound Interest',
    maxHp: 30, col: '#4A90D9',
    itemName: 'Debt Cancellation Act', itemEmoji: '🔥',
    quiz: {
      q: 'You have 22% APR credit card debt. Best move?',
      choices: [
        { t: 'Pay minimum each month to free up cash',       ok: false, why: 'Minimums mostly cover interest — your debt barely shrinks.' },
        { t: 'Pay it off aggressively before investing',      ok: true,  why: 'Correct! Eliminating 22% debt = guaranteed 22% return.' },
        { t: 'Take out a loan to consolidate everything',    ok: false, why: 'Trading high-rate debt for lower-rate still costs you.' },
      ],
    },
  },
  {
    id: 'bubble', name: 'BUBBLE BARON', sub: 'Architect of Market Crashes',
    maxHp: 38, col: '#E63946',
    itemName: 'Audit Report', itemEmoji: '🔍',
    quiz: {
      q: '"This stock will 50x in 30 days! Everyone is buying!" You:',
      choices: [
        { t: 'Buy in immediately — FOMO is real!',           ok: false, why: 'FOMO buying is how bubbles form and how people lose money.' },
        { t: 'Research fundamentals before deciding',         ok: true,  why: 'Correct! Due diligence protects against pump-and-dump.' },
        { t: 'Ask the friend who made money last time',      ok: false, why: "Past performance of others doesn't predict your returns." },
      ],
    },
  },
]

const W2_PLATS = [
  { wx: 160,  y: GY-110, w: 110, h: 14 },
  { wx: 360,  y: GY-145, w: 100, h: 14 },
  { wx: 520,  y: GY-110, w: 110, h: 14 },
  // Zone 0 arena
  { wx: 660,  y: GY-130, w: 130, h: 14 },
  { wx: 860,  y: GY-190, w: 100, h: 14 },
  { wx: 1080, y: GY-140, w: 150, h: 14 },
  { wx: 1220, y: GY-110, w: 110, h: 14 },
  // Between 0-1
  { wx: 1400, y: GY-110, w: 100, h: 14 },
  { wx: 1560, y: GY-150, w: 110, h: 14 },
  { wx: 1750, y: GY-110, w: 100, h: 14 },
  { wx: 1900, y: GY-130, w: 120, h: 14 },
  // Zone 1 arena
  { wx: 2060, y: GY-140, w: 130, h: 14 },
  { wx: 2230, y: GY-200, w: 100, h: 14 },
  { wx: 2450, y: GY-150, w: 150, h: 14 },
  { wx: 2620, y: GY-120, w: 110, h: 14 },
  // Between 1-2
  { wx: 2810, y: GY-110, w: 100, h: 14 },
  { wx: 2980, y: GY-150, w: 110, h: 14 },
  { wx: 3160, y: GY-110, w: 100, h: 14 },
  { wx: 3310, y: GY-130, w: 120, h: 14 },
  // Zone 2 arena
  { wx: 3480, y: GY-130, w: 130, h: 14 },
  { wx: 3660, y: GY-195, w: 100, h: 14 },
  { wx: 3880, y: GY-150, w: 150, h: 14 },
  { wx: 4020, y: GY-115, w: 110, h: 14 },
  // End
  { wx: 4200, y: GY-110, w: 100, h: 14 },
]

interface W2Player { wx:number; y:number; vx:number; vy:number; onGround:boolean; facingRight:boolean; hp:number; invincible:number; fireCd:number; wFrame:number; wTick:number; hasItem:boolean; itemType:string; stuck:number }
interface W2Boss   { wx:number; y:number; vx:number; vy:number; hp:number; maxHp:number; phase:number; facingRight:boolean; onGround:boolean; state:string; stateTimer:number; hitFlash:number; aTick:number; itemDropped:boolean }
interface W2Clone  { wx:number; y:number; isReal:boolean; hp:number; hitFlash:number; revealed:boolean }
interface W2Proj   { id:number; wx:number; y:number; vx:number; vy:number; type:string; life:number; r:number; owner:'p'|'b'; lPhase?:string; lTimer?:number; lh?:number; lw?:number; angle?:number; stuckTimer?:number; growing?:boolean; maxH?:number }
interface W2Item   { wx:number; y:number; bob:number; type:string }
interface W2Part   { wx:number; y:number; vx:number; vy:number; life:number; maxLife:number; col:string; r:number; txt?:string; spin?:number }
type W2GP = 'explore'|'bossIntro'|'fight'|'quiz'|'win'|'lost'
interface W2GS { player:W2Player; boss:W2Boss|null; clones:W2Clone[]; clonesActive:boolean; cloneTimer:number; projs:W2Proj[]; particles:W2Part[]; groundItem:W2Item|null; zoneIdx:number; zoneCleared:[boolean,boolean,boolean]; camX:number; gp:W2GP; tick:number; introT:number; xp:number; pid:number; quizZone:number }

// ── W2 Drawing ─────────────────────────────────────────────────────────────────

function drawW2BG(ctx: CanvasRenderingContext2D, camX: number, tick: number) {
  const cx = camX + W / 2
  // Determine dominant section by camera center
  let bg1: string, bg2: string
  if (cx < 600) { bg1='#87CEEB'; bg2='#D4E8A0' }
  else if (cx < 1300) { bg1='#FFF8F0'; bg2='#F5DEB3' }  // supermarket
  else if (cx < 2000) { bg1='#E8EFF5'; bg2='#C8D8E8' }  // city
  else if (cx < 2700) { bg1='#1A1A2E'; bg2='#16213E' }  // dark office
  else if (cx < 3400) { bg1='#F5F0E8'; bg2='#E8E0D0' }  // bank marble
  else if (cx < 4100) { bg1='#0F0F1A'; bg2='#1A0A2E' }  // stock exchange
  else { bg1='#E8F5E9'; bg2='#C8E6C9' }  // victory
  const grad = ctx.createLinearGradient(0,0,0,GY)
  grad.addColorStop(0, bg1); grad.addColorStop(1, bg2)
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H)

  if (cx < 600) {
    // Rolling hills
    ctx.fillStyle='#8BC34A'
    ctx.beginPath(); ctx.moveTo(0,GY); for(let x=0;x<=W;x+=8) ctx.lineTo(x, GY-50-Math.sin((x+camX)*0.008)*35-Math.sin((x+camX)*0.02)*15); ctx.lineTo(W,GY); ctx.closePath(); ctx.fill()
    // Clouds
    ctx.fillStyle='rgba(255,255,255,0.85)'
    for(let i=0;i<5;i++){const cx2=(i*220-camX*0.2+tick)%W,cy=50+i*18;ctx.beginPath();ctx.ellipse(cx2,cy,50,22,0,0,Math.PI*2);ctx.ellipse(cx2+40,cy-8,34,18,0,0,Math.PI*2);ctx.fill()}
  } else if (cx < 1300) {
    // Supermarket shelves scrolling
    ctx.fillStyle='rgba(200,160,100,0.3)'
    for(let i=0;i<6;i++){const sx=((i*160-camX*0.8)%W+W)%W; ctx.fillRect(sx,40,120,GY-40); ctx.strokeStyle='rgba(140,100,60,0.4)'; ctx.lineWidth=2; ctx.strokeRect(sx,40,120,GY-40)}
    // Price tags flying
    ctx.fillStyle='rgba(255,100,0,0.2)'; ctx.font='10px sans-serif'
    for(let i=0;i<8;i++){const tx=((i*130+tick*2-camX*0.5)%W+W)%W; ctx.fillText('%',tx,80+i*28)}
  } else if (cx >= 2000 && cx < 2700) {
    // Dark office - debt chains
    ctx.fillStyle='rgba(255,255,255,0.05)'
    for(let x=0;x<W;x+=80){ctx.fillRect(x,0,2,GY)}
    ctx.fillStyle='rgba(74,144,217,0.1)'; ctx.font='14px monospace'
    for(let i=0;i<10;i++){const tx=((i*90-camX*0.3)%W+W)%W; ctx.fillText(['$','%','⛓','€','£'][i%5],tx,60+Math.sin(tick*0.03+i)*30)}
  } else if (cx >= 3400 && cx < 4100) {
    // Stock exchange - ticker
    ctx.fillStyle='rgba(0,255,136,0.06)'
    for(let y=0;y<H;y+=40){ctx.fillRect(0,y,W,1)}
    ctx.fillStyle='rgba(255,50,50,0.15)'; ctx.font='12px monospace'
    const symbols = ['GREED','FOMO','PUMP','DUMP','HOLD']
    for(let i=0;i<8;i++){const tx=(((i*120)+tick*3-camX*0.4)%W+W)%W; ctx.fillText(symbols[i%5],tx,30+i%3*14)}
  }

  // Ground
  const gcol = (cx>=2000&&cx<2700) ? '#111118' : (cx>=3400&&cx<4100) ? '#0A0A15' : '#6B4C2A'
  ctx.fillStyle=gcol; ctx.fillRect(0,GY,W,H-GY)
  ctx.strokeStyle=(cx>=2000&&cx<2700)?'rgba(74,144,217,0.6)':(cx>=3400&&cx<4100)?'rgba(0,255,136,0.5)':'#8B6914'
  ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke()
}

function drawW2Plat(ctx: CanvasRenderingContext2D, pl: {wx:number;y:number;w:number;h:number}, camX: number, cx: number) {
  const sx = pl.wx - camX
  if (sx + pl.w < -20 || sx > W + 20) return
  const isDark = (cx>=2000&&cx<2700)||(cx>=3400&&cx<4100)
  ctx.fillStyle = isDark ? '#1E2030' : '#7B5E2A'
  ctx.strokeStyle = isDark ? 'rgba(74,144,217,0.8)' : '#5A3E1A'
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.roundRect(sx, pl.y, pl.w, pl.h, 5); ctx.fill(); ctx.stroke()
  ctx.fillStyle = isDark ? 'rgba(74,144,217,0.4)' : '#A08040'
  ctx.beginPath(); ctx.roundRect(sx, pl.y, pl.w, 6, [5,5,0,0]); ctx.fill()
}

function drawW2Barriers(ctx: CanvasRenderingContext2D, gs: W2GS) {
  if (gs.zoneIdx < 0 || gs.zoneCleared[gs.zoneIdx as 0|1|2]) return
  if (!gs.boss || gs.boss.hp <= 0) return
  const zone = W2_ZONES[gs.zoneIdx]
  const t = gs.tick

  for (const [wx, isLeft] of [[zone.left, true],[zone.right, false]] as [number,boolean][]) {
    const sx = wx - gs.camX
    const col = isLeft ? '#00EEFF' : '#FF4444'
    const col2 = isLeft ? 'rgba(0,238,255,0.15)' : 'rgba(255,68,68,0.15)'
    // Glow
    ctx.fillStyle = col2; ctx.fillRect(sx-12,0,24,H)
    // Main wall
    for (let y=0; y<H; y+=8) {
      const flicker = Math.sin(t*0.3+y*0.5)*0.5+0.5
      ctx.fillStyle = `rgba(${isLeft?'0,238,255':'255,68,68'},${0.6+flicker*0.4})`
      ctx.fillRect(sx-4, y, 8, 6)
    }
    // Sparks
    for (let i=0; i<4; i++) {
      const sy = ((t*4+i*60)%(H+20))-10
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(sx+(Math.random()-0.5)*6, sy, 3, 0, Math.PI*2); ctx.fill()
    }
    ctx.shadowBlur = 0
    // Label
    ctx.fillStyle = col; ctx.font = "bold 10px 'Fredoka One',cursive"; ctx.textAlign = 'center'
    const pulse = Math.sin(t*0.08)*0.5+0.5
    ctx.globalAlpha = 0.5 + pulse*0.5
    ctx.fillText('DEFEAT', sx, H/2-8); ctx.fillText('BOSS!', sx, H/2+8)
    ctx.globalAlpha = 1; ctx.textAlign = 'left'
  }
}

function drawInflationTitan(ctx: CanvasRenderingContext2D, sx: number, sy: number, boss: W2Boss, tick: number) {
  const p2 = boss.phase >= 2
  const bob = Math.sin(tick * 0.06) * 4
  ctx.save(); ctx.translate(sx, sy + bob); ctx.scale(boss.facingRight ? 1 : -1, 1)
  ctx.strokeStyle = '#1A0800'
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 72, 52, 12, 0, 0, Math.PI*2); ctx.fill()
  // Body (very large and round)
  ctx.fillStyle = p2 ? '#CC4400' : '#E8821A'; ctx.lineWidth = 4
  ctx.beginPath(); ctx.ellipse(0, 20, 55, 50, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke()
  // Apron
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(-28,0); ctx.lineTo(-28,60); ctx.lineTo(28,60); ctx.lineTo(28,0); ctx.quadraticCurveTo(0,-10,0,-10); ctx.closePath(); ctx.fill(); ctx.stroke()
  // Price tag gun arm
  const armSwing = Math.sin(boss.aTick*0.12)*15
  ctx.save(); ctx.translate(52,10); ctx.rotate(armSwing*Math.PI/180)
  ctx.fillStyle = p2 ? '#CC4400' : '#E8821A'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(16,0,16,10,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  // Price gun
  ctx.fillStyle = '#666'; ctx.beginPath(); ctx.roundRect(28,-8,28,16,4); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#FF4400'; ctx.beginPath(); ctx.arc(58,0,5,0,Math.PI*2); ctx.fill()
  ctx.restore()
  // Other arm
  ctx.save(); ctx.translate(-52,10); ctx.rotate(-armSwing*Math.PI/180)
  ctx.fillStyle = p2 ? '#CC4400' : '#E8821A'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(-16,0,16,10,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.restore()
  // Head
  ctx.fillStyle = '#FFCCAA'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.ellipse(0,-52,38,34,0,0,Math.PI*2); ctx.fill(); ctx.stroke()
  // Manager hat
  ctx.fillStyle = '#AA3300'
  ctx.beginPath(); ctx.roundRect(-40,-94,80,8,3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-26,-126,52,34,4); ctx.fill(); ctx.strokeStyle='#1A0800'; ctx.lineWidth=2; ctx.strokeRect(-26,-126,52,34)
  // Angry eyes
  if (p2) {
    ctx.strokeStyle='#1A0800'; ctx.lineWidth=3
    for(const ex of[-14,14]){ctx.beginPath();ctx.moveTo(ex-7,-62);ctx.lineTo(ex+7,-50);ctx.moveTo(ex+7,-62);ctx.lineTo(ex-7,-50);ctx.stroke()}
  } else {
    ctx.fillStyle='white'; ctx.lineWidth=2
    for(const ex of[-14,14]){ctx.beginPath();ctx.arc(ex,-56,10,0,Math.PI*2);ctx.fill();ctx.stroke()}
    ctx.fillStyle='#333';ctx.beginPath();ctx.arc(-12,-54,5,0,Math.PI*2);ctx.fill()
    ctx.beginPath();ctx.arc(16,-54,5,0,Math.PI*2);ctx.fill()
  }
  // $ symbol on apron
  ctx.fillStyle='#2D9A4E';ctx.font="bold 24px 'Fredoka One',cursive";ctx.textAlign='center';ctx.fillText('$',0,30);ctx.textAlign='left'
  // Floating price tags around boss
  for(let i=0;i<5;i++){
    const angle=(tick*0.04+i*1.257)*(p2?1.5:1)
    const dist=70+Math.sin(tick*0.05+i)*15
    const tx=Math.cos(angle)*dist, ty=Math.sin(angle)*dist-20
    ctx.fillStyle='rgba(255,130,0,0.8)'; ctx.strokeStyle='#1A0800'; ctx.lineWidth=1
    ctx.beginPath(); ctx.roundRect(tx-15,ty-8,30,16,3); ctx.fill(); ctx.stroke()
    ctx.fillStyle='#1A0800'; ctx.font='7px sans-serif'; ctx.textAlign='center'; ctx.fillText('$'+(2+i*3)+'!',tx,ty+3); ctx.textAlign='left'
  }
  if(boss.hitFlash>0){ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/15})`;ctx.beginPath();ctx.ellipse(0,0,65,70,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

function drawDebtSpiral(ctx: CanvasRenderingContext2D, sx: number, sy: number, boss: W2Boss, tick: number) {
  const p2 = boss.phase >= 2
  const float = Math.sin(tick*0.07)*10
  ctx.save(); ctx.translate(sx, sy + float - 10); ctx.scale(boss.facingRight ? 1 : -1, 1)
  ctx.strokeStyle='#1A0800'
  // Glow aura
  if(p2){ctx.fillStyle='rgba(74,144,217,0.2)';ctx.beginPath();ctx.arc(0,0,80,0,Math.PI*2);ctx.fill()}
  // Floating shadow
  ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(0,80-float,35*0.8,8*0.8,0,0,Math.PI*2);ctx.fill()
  // Chains orbiting
  for(let i=0;i<3;i++){
    const a=tick*0.05*(p2?1.6:1)+i*2.094
    const cx2=Math.cos(a)*55, cy2=Math.sin(a)*35-10
    ctx.strokeStyle='rgba(100,120,180,0.8)'; ctx.lineWidth=3
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(cx2,cy2); ctx.stroke()
    ctx.fillStyle='#5080C0'; ctx.lineWidth=2; ctx.strokeStyle='#1A0800'
    for(let j=0;j<4;j++){
      const jf=j/4; ctx.beginPath();ctx.arc(cx2*jf,cy2*jf,5,0,Math.PI*2);ctx.fill();ctx.stroke()
    }
  }
  // Body (thin, elongated)
  ctx.fillStyle=p2?'#1A3A6A':'#2A5090'; ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,5,22,40,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Suit lapels
  ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.beginPath();ctx.moveTo(-8,-15);ctx.lineTo(0,10);ctx.lineTo(8,-15);ctx.closePath();ctx.fill()
  // Head (skull-like)
  ctx.fillStyle='#E8D5B0'; ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,-52,24,28,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Briefcase
  ctx.fillStyle='#8B4513'; ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(-18,30,36,24,4);ctx.fill();ctx.stroke()
  ctx.fillStyle='#6B3410';ctx.fillRect(-18,38,36,4)
  // Red X eyes
  ctx.strokeStyle='#E63946'; ctx.lineWidth=3
  for(const ex of[-9,9]){ctx.beginPath();ctx.moveTo(ex-5,-58);ctx.lineTo(ex+5,-46);ctx.moveTo(ex+5,-58);ctx.lineTo(ex-5,-46);ctx.stroke()}
  // Debt bills orbiting at distance
  for(let i=0;i<6;i++){
    const a=tick*-0.06*(p2?1.4:1)+i*1.047
    const bx=Math.cos(a)*90, by=Math.sin(a)*60-10
    ctx.fillStyle='rgba(133,193,126,0.85)'; ctx.strokeStyle='#1A0800'; ctx.lineWidth=1
    ctx.save();ctx.translate(bx,by);ctx.rotate(a)
    ctx.beginPath();ctx.roundRect(-14,-7,28,14,2);ctx.fill();ctx.stroke()
    ctx.fillStyle='#1A0800';ctx.font='7px sans-serif';ctx.textAlign='center';ctx.fillText('+%',0,3);ctx.textAlign='left'
    ctx.restore()
  }
  if(boss.hitFlash>0){ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/15})`;ctx.beginPath();ctx.ellipse(0,0,45,70,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

function drawBubbleBaron(ctx: CanvasRenderingContext2D, sx: number, sy: number, boss: W2Boss, tick: number) {
  const p2 = boss.phase >= 2
  const bounce = Math.sin(tick*0.09)*(p2?6:3)
  ctx.save(); ctx.translate(sx, sy + bounce); ctx.scale(boss.facingRight ? 1 : -1, 1)
  ctx.strokeStyle='#1A0800'
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.ellipse(0,78,48,11,0,0,Math.PI*2);ctx.fill()
  // Suspenders
  ctx.strokeStyle='#CC3333'; ctx.lineWidth=6
  ctx.beginPath();ctx.moveTo(-20,-30);ctx.lineTo(-14,40);ctx.stroke()
  ctx.beginPath();ctx.moveTo(20,-30);ctx.lineTo(14,40);ctx.stroke()
  // Rotund body
  ctx.fillStyle=p2?'#CC2222':'#E63946'; ctx.lineWidth=4; ctx.strokeStyle='#1A0800'
  ctx.beginPath();ctx.ellipse(0,28,50,44,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Pants
  ctx.fillStyle=p2?'#551111':'#7B1A1A'; ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(-20,66,16,20,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.ellipse(20,66,16,20,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Money bag arm
  const swing=Math.sin(boss.aTick*0.1)*18
  ctx.save();ctx.translate(52,22);ctx.rotate(swing*Math.PI/180)
  ctx.fillStyle=p2?'#CC2222':'#E63946';ctx.lineWidth=3;ctx.strokeStyle='#1A0800'
  ctx.beginPath();ctx.ellipse(14,0,14,10,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#85C17E';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(34,0,20,24,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1A0800';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('$',34,5);ctx.textAlign='left'
  ctx.restore()
  // Other arm
  ctx.save();ctx.translate(-52,22);ctx.rotate(-swing*Math.PI/180)
  ctx.fillStyle=p2?'#CC2222':'#E63946';ctx.lineWidth=3;ctx.strokeStyle='#1A0800'
  ctx.beginPath();ctx.ellipse(-14,0,14,10,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.restore()
  // Head
  ctx.fillStyle='#FFCCAA';ctx.lineWidth=3;ctx.strokeStyle='#1A0800'
  ctx.beginPath();ctx.ellipse(0,-32,34,30,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  // Top hat
  ctx.fillStyle='#1A0800'
  ctx.beginPath();ctx.roundRect(-36,-70,72,10,3);ctx.fill()
  ctx.beginPath();ctx.roundRect(-22,-108,44,40,4);ctx.fill()
  // Hat band
  ctx.fillStyle='#FFCD00';ctx.fillRect(-22,-72,44,8)
  // Monocle
  ctx.fillStyle='rgba(200,230,255,0.4)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=3
  ctx.beginPath();ctx.arc(14,-35,12,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.strokeStyle='#FFCD00';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(22,-23);ctx.lineTo(28,-20);ctx.stroke()
  // Eyes
  ctx.fillStyle='white';ctx.lineWidth=2;ctx.strokeStyle='#1A0800'
  ctx.beginPath();ctx.arc(-10,-36,8,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.arc(14,-36,8,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1A0800'
  ctx.beginPath();ctx.arc(-9,-35,4,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.arc(15,-35,4,0,Math.PI*2);ctx.fill()
  if(p2){ctx.strokeStyle='#E63946';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-20,12,0.2,Math.PI-0.2);ctx.stroke()}
  else{ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-22,10,0.2,Math.PI-0.2,true);ctx.stroke()}
  // Orbiting bubbles
  for(let i=0;i<5;i++){
    const a=tick*0.04*(p2?1.5:1)+i*1.257
    const bx=Math.cos(a)*72,by=Math.sin(a)*48-15
    const br=8+Math.sin(tick*0.06+i)*2
    ctx.fillStyle='rgba(100,200,255,0.3)';ctx.strokeStyle='rgba(150,220,255,0.8)';ctx.lineWidth=2
    ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.arc(bx-br*0.3,by-br*0.3,br*0.25,0,Math.PI*2);ctx.fill()
  }
  if(boss.hitFlash>0){ctx.fillStyle=`rgba(255,255,255,${boss.hitFlash/15})`;ctx.beginPath();ctx.ellipse(0,10,60,70,0,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}

function drawW2Boss(ctx: CanvasRenderingContext2D, boss: W2Boss, bossIdx: number, tick: number, camX: number) {
  const sx = boss.wx - camX, sy = boss.y - BOSS_HALF
  if (sx < -120 || sx > W + 120) return
  if (bossIdx === 0) drawInflationTitan(ctx, sx, sy, boss, tick)
  else if (bossIdx === 1) drawDebtSpiral(ctx, sx, sy, boss, tick)
  else drawBubbleBaron(ctx, sx, sy, boss, tick)
}

function drawW2Clones(ctx: CanvasRenderingContext2D, clones: W2Clone[], tick: number, camX: number) {
  for (const cl of clones) {
    const sx = cl.wx - camX, sy = cl.y - BOSS_HALF
    if (sx < -100 || sx > W + 100) continue
    ctx.save(); ctx.translate(sx, sy)
    // Draw a simpler Bubble Baron clone
    const bounce = Math.sin(tick*0.09+cl.wx*0.1)*3
    ctx.translate(0, bounce)
    // Body
    ctx.fillStyle = cl.revealed && cl.isReal ? '#FFEE44' : (cl.revealed && !cl.isReal ? '#888' : '#E63946')
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.ellipse(0, 28, 45, 40, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke()
    // Head
    ctx.fillStyle = cl.revealed && cl.isReal ? '#FFE0A0' : '#FFCCAA'
    ctx.beginPath(); ctx.ellipse(0, -28, 30, 27, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke()
    // Hat
    ctx.fillStyle = '#1A0800'; ctx.beginPath(); ctx.roundRect(-30,-58,60,8,3); ctx.fill()
    ctx.beginPath(); ctx.roundRect(-18,-88,36,32,4); ctx.fill()
    // Reveal effect
    if (cl.revealed) {
      if (cl.isReal) {
        // Gold glow
        ctx.shadowColor = '#FFCD00'; ctx.shadowBlur = 25
        ctx.strokeStyle = '#FFCD00'; ctx.lineWidth = 4
        ctx.beginPath(); ctx.ellipse(0, 0, 60, 80, 0, 0, Math.PI*2); ctx.stroke()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#FFCD00'; ctx.font = "bold 12px 'Fredoka One',cursive"; ctx.textAlign = 'center'
        ctx.fillText('REAL!', 0, -100); ctx.textAlign = 'left'
      } else {
        // X mark
        ctx.strokeStyle = '#FF4444'; ctx.lineWidth = 6
        ctx.beginPath(); ctx.moveTo(-30,-70); ctx.lineTo(30,20); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(30,-70); ctx.lineTo(-30,20); ctx.stroke()
        ctx.fillStyle = '#FF4444'; ctx.font = "bold 12px 'Fredoka One',cursive"; ctx.textAlign = 'center'
        ctx.fillText('FAKE!', 0, -100); ctx.textAlign = 'left'
      }
    }
    if (cl.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${cl.hitFlash/12})`; ctx.beginPath(); ctx.ellipse(0, 0, 55, 75, 0, 0, Math.PI*2); ctx.fill()
    }
    ctx.restore()
  }
}

function drawW2GroundItem(ctx: CanvasRenderingContext2D, item: W2Item, tick: number, camX: number) {
  const sx = item.wx - camX
  if (sx < -40 || sx > W + 40) return
  const bob = Math.sin(tick * 0.08) * 6
  const bd = W2_BOSSES.find(b => b.itemName === item.type)!
  // Glow pulse
  const pulse = Math.sin(tick * 0.1) * 0.5 + 0.5
  ctx.fillStyle = `rgba(255,205,0,${0.15 + pulse * 0.2})`
  ctx.beginPath(); ctx.arc(sx, item.y + bob, 26 + pulse * 4, 0, Math.PI*2); ctx.fill()
  // Main orb
  ctx.fillStyle = bd ? bd.col : '#FFCD00'
  ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 3
  ctx.shadowColor = '#FFCD00'; ctx.shadowBlur = 12
  ctx.beginPath(); ctx.arc(sx, item.y + bob, 18, 0, Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.shadowBlur = 0
  // Emoji
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(bd?.itemEmoji || '⭐', sx, item.y + bob + 5)
  ctx.textAlign = 'left'
  // Label
  ctx.fillStyle = '#FFCD00'; ctx.font = "bold 10px 'Fredoka One',cursive"; ctx.textAlign = 'center'
  ctx.fillText('C: USE!', sx, item.y + bob - 28)
  ctx.textAlign = 'left'
}

function drawW2Projs(ctx: CanvasRenderingContext2D, projs: W2Proj[], camX: number) {
  for (const pr of projs) {
    const sx = pr.wx - camX
    if (sx < -60 || sx > W + 60) continue

    if (pr.type === 'w2bullet') {
      ctx.fillStyle='#FFCD00';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
      ctx.beginPath();ctx.arc(sx,pr.y,pr.r,0,Math.PI*2);ctx.fill();ctx.stroke()
      ctx.fillStyle='rgba(255,205,0,0.4)';ctx.beginPath();ctx.arc(sx,pr.y,pr.r+4,0,Math.PI*2);ctx.fill()
    } else if (pr.type === 'w2tag') {
      ctx.save();ctx.translate(sx,pr.y);ctx.rotate(Math.atan2(pr.vy,pr.vx))
      ctx.fillStyle='#FF7B25';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
      ctx.beginPath();ctx.roundRect(-16,-8,32,16,3);ctx.fill();ctx.stroke()
      ctx.fillStyle='white';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('$$$!',0,3);ctx.textAlign='left'
      ctx.restore()
    } else if (pr.type === 'w2bill') {
      ctx.save();ctx.translate(sx,pr.y);ctx.rotate(pr.angle||0)
      ctx.fillStyle=pr.stuckTimer&&pr.stuckTimer>0?'rgba(133,193,126,0.6)':'#85C17E'
      ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
      ctx.beginPath();ctx.roundRect(-14,-7,28,14,2);ctx.fill();ctx.stroke()
      ctx.fillStyle='#1A0800';ctx.font='7px sans-serif';ctx.textAlign='center';ctx.fillText('+22%',0,3);ctx.textAlign='left'
      ctx.restore()
    } else if (pr.type === 'w2bubble') {
      const a = pr.life / pr.life  // always 1 but nice
      ctx.fillStyle=`rgba(100,200,255,${0.3*(pr.life/80)})`;ctx.strokeStyle=`rgba(150,220,255,${0.8*(pr.life/80)})`;ctx.lineWidth=2
      ctx.beginPath();ctx.arc(sx,pr.y,pr.r,0,Math.PI*2);ctx.fill();ctx.stroke()
      ctx.fillStyle=`rgba(255,255,255,${0.5*(pr.life/80)})`;ctx.beginPath();ctx.arc(sx-pr.r*0.3,pr.y-pr.r*0.3,pr.r*0.25,0,Math.PI*2);ctx.fill()
      void a
    } else if (pr.type === 'w2spike') {
      const h = pr.growing ? (1 - pr.life/60) * (pr.maxH||80) : (pr.maxH||80)
      ctx.fillStyle='#CC0000';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
      ctx.beginPath();ctx.moveTo(sx-10,GY);ctx.lineTo(sx,GY-h);ctx.lineTo(sx+10,GY);ctx.closePath();ctx.fill();ctx.stroke()
      ctx.fillStyle='rgba(255,0,0,0.3)';ctx.beginPath();ctx.moveTo(sx-14,GY);ctx.lineTo(sx,GY-h-10);ctx.lineTo(sx+14,GY);ctx.closePath();ctx.fill()
    } else if (pr.type === 'w2shockwave') {
      ctx.strokeStyle='#FF7B25';ctx.lineWidth=5;ctx.globalAlpha=pr.life/50
      ctx.beginPath();ctx.moveTo(sx-pr.r,GY-4);ctx.lineTo(sx+pr.r,GY-4);ctx.stroke()
      ctx.globalAlpha=1
    } else if (pr.type === 'w2nova') {
      ctx.fillStyle='rgba(74,144,217,0.7)';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
      ctx.save();ctx.translate(sx,pr.y);ctx.rotate(pr.angle||0)
      ctx.beginPath();ctx.roundRect(-12,-6,24,12,2);ctx.fill();ctx.stroke()
      ctx.fillStyle='#1A0800';ctx.font='7px sans-serif';ctx.textAlign='center';ctx.fillText('%',0,3);ctx.textAlign='left'
      ctx.restore()
    } else if (pr.type === 'w2investor') {
      ctx.fillStyle='rgba(200,100,50,0.8)';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
      ctx.beginPath();ctx.arc(sx,pr.y-20,10,0,Math.PI*2);ctx.fill();ctx.stroke()
      ctx.beginPath();ctx.roundRect(sx-8,pr.y-10,16,22,3);ctx.fill();ctx.stroke()
      ctx.fillStyle='white';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText('📈',sx,pr.y-18);ctx.textAlign='left'
    }
  }
}

function drawW2Particles(ctx: CanvasRenderingContext2D, parts: W2Part[], camX: number) {
  for (const p of parts) {
    const sx = p.wx - camX
    if (sx < -60 || sx > W + 60) continue
    const a = p.life / p.maxLife
    if (p.txt) {
      ctx.globalAlpha = a; ctx.font = `${p.r}px sans-serif`; ctx.textAlign = 'center'
      ctx.fillStyle = p.col; ctx.fillText(p.txt, sx, p.y)
      ctx.textAlign = 'left'
    } else {
      ctx.fillStyle = p.col; ctx.globalAlpha = a
      ctx.beginPath(); ctx.arc(sx, p.y, p.r * a, 0, Math.PI*2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

function drawW2Player(ctx: CanvasRenderingContext2D, p: W2Player, tick: number, camX: number) {
  const sx = p.wx - camX
  const stuckFlash = p.stuck > 0 && Math.floor(p.stuck / 4) % 2 === 0
  if (stuckFlash) {
    ctx.fillStyle = 'rgba(133,193,126,0.4)'
    ctx.beginPath(); ctx.ellipse(sx+16, p.y+30, 24, 36, 0, 0, Math.PI*2); ctx.fill()
  }
  drawPlayer(ctx, { x: sx, y: p.y, vx: p.vx, vy: p.vy, onGround: p.onGround, facingRight: p.facingRight, hp: p.hp, invincible: p.invincible, fireCd: p.fireCd, wFrame: p.wFrame, wTick: p.wTick }, tick)
  // Item indicator above player
  if (p.hasItem) {
    const bd = W2_BOSSES.find(b => b.itemName === p.itemType)
    const pulse = Math.sin(tick * 0.15) * 0.5 + 0.5
    ctx.fillStyle = `rgba(255,205,0,${0.6+pulse*0.4})`;ctx.font='16px sans-serif';ctx.textAlign='center'
    ctx.fillText(bd?.itemEmoji||'⭐', sx+16, p.y - 10)
    ctx.fillStyle='rgba(255,205,0,0.9)';ctx.font="bold 9px 'Fredoka One',cursive"
    ctx.fillText('C: ACTIVATE', sx+16, p.y - 26); ctx.textAlign='left'
  }
}

function drawW2BossHP(ctx: CanvasRenderingContext2D, boss: W2Boss, bossIdx: number) {
  const bd = W2_BOSSES[bossIdx]
  const bw=280, bh=16, bx=(W-bw)/2, by=14
  ctx.fillStyle='rgba(0,0,0,0.65)';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(bx-2,by-2,bw+4,bh+4,8);ctx.fill();ctx.stroke()
  ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,6);ctx.fill()
  const ratio=Math.max(0,boss.hp/boss.maxHp)
  const col=boss.phase>=2?'#FF2200':boss.phase>=1?'#FF7B25':bd.col
  if(ratio>0){ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(bx,by,bw*ratio,bh,6);ctx.fill()}
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,6);ctx.stroke()
  ctx.fillStyle='white';ctx.font="bold 11px 'Fredoka One',cursive";ctx.textAlign='center'
  ctx.fillText(`${bd.name} — ${boss.hp}/${boss.maxHp}`,W/2,by+bh*2+5)
  if(boss.phase>=1){ctx.fillStyle=boss.phase>=2?'#FF2200':'#FF7B25';ctx.font="bold 10px 'Fredoka One',cursive";ctx.fillText(boss.phase>=2?'⚡ ENRAGED':'⚠ PHASE 2',W/2,by+bh*3+5)}
  ctx.textAlign='left'
}

function drawW2HUD(ctx: CanvasRenderingContext2D, p: W2Player, gs: W2GS) {
  // HP
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,H-46,130,32,10);ctx.fill();ctx.stroke()
  for(let i=0;i<3;i++){ctx.fillStyle=p.hp>i?'#E63946':'#333';ctx.font='22px sans-serif';ctx.fillText('♥',20+i*42,H-24)}
  // Controls
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,H-82,240,32,10);ctx.fill();ctx.stroke()
  ctx.fillStyle='#FFCD00';ctx.font="11px 'Fredoka One',cursive"
  ctx.fillText('Z: Shoot  ←→: Move  ↑: Jump  C: Item',20,H-60)
  // Zone progress
  const cleared = gs.zoneCleared.filter(Boolean).length
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(W-130,14,116,30,8);ctx.fill();ctx.stroke()
  ctx.fillStyle='#FFCD00';ctx.font="bold 11px 'Fredoka One',cursive";ctx.textAlign='right'
  ctx.fillText(`Bosses: ${cleared}/3`,W-18,34);ctx.textAlign='left'
  // Stuck debuff indicator
  if(p.stuck>0){
    ctx.fillStyle='rgba(133,193,126,0.85)';ctx.font="bold 12px 'Fredoka One',cursive"
    ctx.fillText('STUCK! '+(Math.ceil(p.stuck/60))+'s',W/2-50,H-20)
  }
  // XP
  if(gs.xp>0){
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(W-130,48,116,28,8);ctx.fill();ctx.stroke()
    ctx.fillStyle='#FFCD00';ctx.textAlign='right';ctx.font="bold 11px 'Fredoka One',cursive"
    ctx.fillText(`XP: ${gs.xp}`,W-18,66);ctx.textAlign='left'
  }
}

// ── W2 Logic ───────────────────────────────────────────────────────────────────

function initW2Boss(zoneIdx: number): W2Boss {
  const zone = W2_ZONES[zoneIdx]
  const bd = W2_BOSSES[zoneIdx]
  return {
    wx: zone.bossWx, y: GY - BOSS_HALF,
    vx: -1.2, vy: 0,
    hp: bd.maxHp, maxHp: bd.maxHp,
    phase: 0, facingRight: false,
    onGround: true, state: 'patrol', stateTimer: 80,
    hitFlash: 0, aTick: 0, itemDropped: false,
  }
}

function w2BossAct(gs: W2GS) {
  if (!gs.boss || gs.zoneIdx < 0) return
  const boss = gs.boss
  const bossIdx = gs.zoneIdx
  const bd = W2_BOSSES[bossIdx]
  const p = gs.player
  boss.aTick++
  if (boss.hitFlash > 0) boss.hitFlash--
  boss.stateTimer--
  const ratio = boss.hp / boss.maxHp
  boss.phase = ratio < 0.33 ? 2 : ratio < 0.67 ? 1 : 0

  // Drop item at 40% HP
  if (!boss.itemDropped && boss.hp <= Math.floor(boss.maxHp * 0.4)) {
    boss.itemDropped = true
    gs.groundItem = { wx: boss.wx + 60, y: GY - 24, bob: 0, type: bd.itemName }
  }

  const zone = W2_ZONES[gs.zoneIdx]
  // Gravity
  boss.vy = Math.min(boss.vy + 0.45, 14)
  boss.y += boss.vy
  if (boss.y >= GY - BOSS_HALF) { boss.y = GY - BOSS_HALF; boss.vy = 0; boss.onGround = true }
  boss.wx += boss.vx
  boss.wx = Math.max(zone.left + 60, Math.min(boss.wx, zone.right - 60))
  if (boss.wx <= zone.left + 60 || boss.wx >= zone.right - 60) boss.vx *= -1
  boss.facingRight = p.wx > boss.wx

  const spd = 1.3 + boss.phase * 0.8
  const ph = boss.phase

  if (boss.stateTimer <= 0) {
    const r = Math.random()
    if (bossIdx === 0) { // Inflation Titan
      if (r < 0.25) { boss.state='patrol'; boss.stateTimer=80; boss.vx=spd*(r>0.125?1:-1) }
      else if (r < 0.50) { boss.state='atk_tags'; boss.stateTimer=65 }
      else if (r < 0.72) { boss.state='stamp_slam'; boss.stateTimer=60; if(boss.onGround)boss.vy=-14 }
      else { boss.state='price_surge'; boss.stateTimer=70+ph*10 }
    } else if (bossIdx === 1) { // Debt Spiral
      if (r < 0.20) { boss.state='patrol'; boss.stateTimer=70; boss.vx=spd*(r>0.10?1:-1) }
      else if (r < 0.45) { boss.state='atk_bills'; boss.stateTimer=60 }
      else if (r < 0.68) { boss.state='interest_nova'; boss.stateTimer=55 }
      else { boss.state='chain_sweep'; boss.stateTimer=80; boss.vx=0 }
    } else { // Bubble Baron
      if (r < 0.20) { boss.state='patrol'; boss.stateTimer=70; boss.vx=spd*(r>0.10?1:-1) }
      else if (r < 0.45) { boss.state='atk_bubbles'; boss.stateTimer=60 }
      else if (r < 0.65 && !gs.clonesActive && boss.hp < boss.maxHp*0.5) { boss.state='clone_split'; boss.stateTimer=20 }
      else if (r < 0.82) { boss.state='crash_spike'; boss.stateTimer=65 }
      else { boss.state='fomo_rush'; boss.stateTimer=55 }
    }
  }

  const t = boss.stateTimer
  if (boss.state === 'patrol' || boss.state === 'charge') boss.wx += boss.vx * 0.5

  // Spawn projectiles
  if (bossIdx === 0) {
    if (boss.state==='atk_tags'&&(t===50||(ph>=1&&t===30)||(ph>=2&&t===15))) {
      const count=ph>=2?5:ph>=1?4:3
      for(let i=0;i<count;i++){
        const a=Math.atan2(p.y-boss.y,p.wx-boss.wx)+(i/(count-1||1)-0.5)*1.1
        gs.projs.push({id:_pid++,wx:boss.wx,y:boss.y-40,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,type:'w2tag',life:80,r:10,owner:'b'})
      }
    }
    if (boss.state==='stamp_slam'&&boss.onGround&&boss.stateTimer>25) {
      for(const dir of[-1,1])gs.projs.push({id:_pid++,wx:boss.wx,y:GY-6,vx:dir*8,vy:0,type:'w2shockwave',life:50,r:16,owner:'b'})
      boss.state='patrol'; boss.stateTimer=80
    }
    if (boss.state==='price_surge'&&t%8===0&&t>10) {
      const a=Math.atan2(p.y-boss.y,p.wx-boss.wx)+(Math.random()-0.5)*1.4
      gs.projs.push({id:_pid++,wx:boss.wx,y:boss.y-40,vx:Math.cos(a)*6,vy:Math.sin(a)*6,type:'w2tag',life:75,r:9,owner:'b'})
    }
  } else if (bossIdx === 1) {
    if (boss.state==='atk_bills'&&(t===48||(ph>=1&&t===28))) {
      const count=ph>=2?4:ph>=1?3:2
      for(let i=0;i<count;i++){
        const a=Math.atan2(p.y-boss.y,p.wx-boss.wx)+(i/(count-1||1)-0.5)*0.9
        gs.projs.push({id:_pid++,wx:boss.wx,y:boss.y-30,vx:Math.cos(a)*4.5,vy:Math.sin(a)*4.5,type:'w2bill',life:100,r:10,owner:'b',angle:a,stuckTimer:180})
      }
    }
    if (boss.state==='interest_nova'&&t===42) {
      const count=ph>=2?14:ph>=1?10:8
      for(let i=0;i<count;i++){
        const a=(i/count)*Math.PI*2
        gs.projs.push({id:_pid++,wx:boss.wx,y:boss.y-20,vx:Math.cos(a)*4,vy:Math.sin(a)*4,type:'w2nova',life:80,r:9,owner:'b',angle:a})
      }
    }
    if (boss.state==='chain_sweep'&&t===65) {
      // Chain sweeps from left to right of zone
      gs.projs.push({id:_pid++,wx:zone.left,y:GY-30,vx:6+ph*2,vy:0,type:'w2shockwave',life:80,r:20,owner:'b'})
      if(ph>=1)gs.projs.push({id:_pid++,wx:zone.left,y:GY-70,vx:6+ph*2,vy:0,type:'w2shockwave',life:80,r:14,owner:'b'})
    }
  } else { // Bubble Baron
    if (boss.state==='atk_bubbles'&&t===48) {
      const count=ph>=2?10:ph>=1?8:6
      for(let i=0;i<count;i++){
        const a=(i/count)*Math.PI*2+Math.random()*0.3
        gs.projs.push({id:_pid++,wx:boss.wx+Math.cos(a)*30,y:boss.y-30,vx:Math.cos(a)*1.5,vy:-2.5-Math.random()*1.5,type:'w2bubble',life:90,r:12+Math.random()*6,owner:'b'})
      }
    }
    if (boss.state==='clone_split'&&t===1) {
      gs.clonesActive=true; gs.cloneTimer=480
      const positions=[boss.wx-160,boss.wx,boss.wx+160]
      const realIdx=Math.floor(Math.random()*3)
      gs.clones=positions.map((wx,i)=>({wx,y:boss.y,isReal:i===realIdx,hp:i===realIdx?boss.hp:1,hitFlash:0,revealed:false}))
      boss.state='patrol'; boss.stateTimer=120
    }
    if (boss.state==='crash_spike'&&(t===50||(ph>=1&&t===32)||(ph>=2&&t===18))) {
      const count=ph>=2?5:ph>=1?4:3
      for(let i=0;i<count;i++){
        const tx=p.wx+(i-Math.floor(count/2))*55+((Math.random()-0.5)*30)
        gs.projs.push({id:_pid++,wx:tx,y:GY,vx:0,vy:0,type:'w2spike',life:60,r:10,owner:'b',growing:true,maxH:80+Math.random()*40})
      }
    }
    if (boss.state==='fomo_rush'&&t===50) {
      const dir=boss.facingRight?1:-1
      for(let i=0;i<(ph+2);i++){
        gs.projs.push({id:_pid++,wx:boss.wx-dir*80*(i+1),y:GY-34,vx:dir*5,vy:0,type:'w2investor',life:100,r:12,owner:'b'})
      }
    }
  }
}

function w2UpdateProjs(projs: W2Proj[], player: W2Player, camX: number): { projs: W2Proj[]; hitPlayer: boolean; stuckHit: boolean } {
  const kept: W2Proj[] = []
  let hitPlayer = false, stuckHit = false
  const px = player.wx + 16, py = player.y + 30
  const W2_WORLD_W_LOCAL = W2_WORLD_W

  for (const pr of projs) {
    pr.life--
    if (pr.life <= 0) continue

    if (pr.type === 'w2shockwave') {
      pr.wx += pr.vx; pr.r = Math.min(pr.r + 4, 90)
    } else if (pr.type === 'w2spike') {
      // Spikes grow then stay; hurt player on contact
    } else {
      pr.wx += pr.vx; pr.y += pr.vy
    }
    if (pr.wx < -100 || pr.wx > W2_WORLD_W_LOCAL + 100) continue
    kept.push(pr)

    // Player collision (only for boss projs)
    if (pr.owner === 'b' && player.invincible <= 0) {
      let hit = false
      if (pr.type === 'w2shockwave') {
        const dx = px - pr.wx; if (Math.abs(dx) < pr.r && Math.abs(py-GY)<28) hit=true
      } else if (pr.type === 'w2spike') {
        if (Math.abs(px-pr.wx)<12 && py>GY-((1-pr.life/60)*(pr.maxH||80))-5) hit=true
      } else {
        const dx=px-pr.wx,dy=py-pr.y
        if(Math.sqrt(dx*dx+dy*dy)<pr.r+14) {
          hit=true
          if(pr.type==='w2bill'){stuckHit=true}
        }
      }
      if(hit){hitPlayer=true;pr.life=0}
    }
  }
  void camX
  return {projs:kept, hitPlayer, stuckHit}
}

function w2CheckPlayerBullets(gs: W2GS): boolean {
  // Returns true if main boss killed (or all clones merged)
  let bossKilled = false
  for (const pr of gs.projs) {
    if (pr.owner !== 'p') continue
    if (gs.clonesActive) {
      for (const cl of gs.clones) {
        if (cl.hp <= 0) continue
        const dx = pr.wx - cl.wx, dy = pr.y - (cl.y - 20)
        if (Math.abs(dx)<55&&Math.abs(dy)<65) {
          pr.life = 0
          cl.hp -= 1; cl.hitFlash = 12
          if (cl.isReal && gs.boss) { gs.boss.hp -= 1; gs.boss.hitFlash = 12; if(gs.boss.hp<=0){gs.boss.hp=0;bossKilled=true} }
          else if (!cl.isReal && cl.hp <= 0) {
            // Spawn particles on fake death
            for(let i=0;i<8;i++) gs.particles.push({wx:cl.wx,y:cl.y-30,vx:(Math.random()-0.5)*4,vy:-3-Math.random()*3,life:40,maxLife:40,col:'#888',r:6,txt:i===0?'FAKE!':undefined})
          }
        }
      }
    } else if (gs.boss && gs.boss.hp > 0) {
      const dx = pr.wx - gs.boss.wx, dy = pr.y - (gs.boss.y - 20)
      if (Math.abs(dx)<60&&Math.abs(dy)<70) {
        pr.life = 0; gs.boss.hp -= 1; gs.boss.hitFlash = 12
        if (gs.boss.hp <= 0) { gs.boss.hp = 0; bossKilled = true }
      }
    }
  }
  return bossKilled
}

function activateItem(gs: W2GS) {
  const p = gs.player
  const itemType = p.itemType
  p.hasItem = false; p.itemType = ''

  if (itemType === 'Price Truth Report' && gs.boss) {
    const dmg = 10
    gs.boss.hp = Math.max(0, gs.boss.hp - dmg); gs.boss.hitFlash = 30
    // Golden pillars rising from ground
    for (let i=0;i<16;i++) {
      const wx = gs.boss.wx + (i-8)*25
      gs.particles.push({wx,y:GY,vx:(Math.random()-0.5)*2,vy:-9-Math.random()*5,life:70,maxLife:70,col:'#FFCD00',r:8})
      gs.particles.push({wx:wx+6,y:GY,vx:(Math.random()-0.5)*2,vy:-11-Math.random()*4,life:55,maxLife:55,col:'#FFF080',r:5})
    }
    gs.particles.push({wx:gs.boss.wx,y:gs.boss.y-80,vx:0,vy:-1,life:90,maxLife:90,col:'#FFCD00',r:24,txt:'📊'})
    gs.particles.push({wx:gs.boss.wx,y:gs.boss.y-60,vx:0,vy:-0.5,life:80,maxLife:80,col:'#FFCD00',r:18,txt:`-${dmg} HP!`})
  } else if (itemType === 'Debt Cancellation Act' && gs.boss) {
    const dmg = 14
    gs.boss.hp = Math.max(0, gs.boss.hp - dmg); gs.boss.hitFlash = 35
    // Tornado of burning bills
    for (let i=0;i<24;i++) {
      const a=(i/24)*Math.PI*2
      gs.particles.push({wx:gs.boss.wx+Math.cos(a)*50,y:gs.boss.y-30+Math.sin(a)*40,vx:Math.cos(a+Math.PI/2)*3,vy:Math.sin(a+Math.PI/2)*3-2,life:80,maxLife:80,col:'#85C17E',r:6})
    }
    gs.particles.push({wx:gs.boss.wx,y:gs.boss.y-70,vx:0,vy:-1,life:100,maxLife:100,col:'#FF6B00',r:26,txt:'🔥'})
    gs.particles.push({wx:gs.boss.wx,y:gs.boss.y-50,vx:0,vy:-0.5,life:85,maxLife:85,col:'#FFCD00',r:18,txt:`-${dmg} HP!`})
  } else if (itemType === 'Audit Report') {
    if (gs.clonesActive) {
      for (const cl of gs.clones) cl.revealed = true
      gs.particles.push({wx:gs.boss?.wx||gs.player.wx,y:(gs.boss?.y||gs.player.y)-80,vx:0,vy:-0.8,life:100,maxLife:100,col:'#FFCD00',r:28,txt:'🔍'})
    } else if (gs.boss) {
      const dmg = 9; gs.boss.hp = Math.max(0, gs.boss.hp - dmg); gs.boss.hitFlash = 25
      gs.particles.push({wx:gs.boss.wx,y:gs.boss.y-80,vx:0,vy:-1,life:90,maxLife:90,col:'#FFCD00',r:26,txt:'🔍'})
      gs.particles.push({wx:gs.boss.wx,y:gs.boss.y-55,vx:0,vy:-0.5,life:80,maxLife:80,col:'#FFCD00',r:18,txt:`-${dmg} HP!`})
    }
  }
}

function initW2GS(): W2GS {
  return {
    player: { wx:80, y:GY-60, vx:0, vy:0, onGround:true, facingRight:true, hp:3, invincible:0, fireCd:0, wFrame:0, wTick:0, hasItem:false, itemType:'', stuck:0 },
    boss: null, clones: [], clonesActive: false, cloneTimer: 0,
    projs: [], particles: [], groundItem: null,
    zoneIdx: -1, zoneCleared: [false,false,false],
    camX: 0, gp: 'explore', tick: 0, introT: 0, xp: 0, pid: 0, quizZone: -1,
  }
}

// ── BossGauntlet component ─────────────────────────────────────────────────────
function BossGauntlet({ onBack }: { onBack: () => void }) {
  const cvs  = useRef<HTMLCanvasElement>(null)
  const raf  = useRef(0)
  const keys = useRef({ left:false, right:false, up:false, shoot:false, item:false })
  const gsRef = useRef<W2GS>(initW2GS())

  const [gp, setGp] = useState<W2GP>('explore')
  const [quizIn, setQuizIn] = useState(false)
  const [quizRes, setQuizRes] = useState<{ok:boolean;why:string}|null>(null)
  const [hpDisp, setHpDisp] = useState(3)
  const [xpDisp, setXpDisp] = useState(0)
  const [introName, setIntroName] = useState('')
  const [introSub, setIntroSub] = useState('')
  const [introCol, setIntroCol] = useState('#FFCD00')
  const [quizZoneDisp, setQuizZoneDisp] = useState(0)

  useEffect(()=>{
    const dn=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a') keys.current.left=true
      if(e.key==='ArrowRight'||e.key==='d') keys.current.right=true
      if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.current.up=true
      if(e.key==='z'||e.key==='Z'||e.key==='x'||e.key==='X') keys.current.shoot=true
      if(e.key==='c'||e.key==='C'||e.key==='Enter') keys.current.item=true
      if(e.key===' ') e.preventDefault()
    }
    const up=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a') keys.current.left=false
      if(e.key==='ArrowRight'||e.key==='d') keys.current.right=false
      if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.current.up=false
      if(e.key==='z'||e.key==='Z'||e.key==='x'||e.key==='X') keys.current.shoot=false
      if(e.key==='c'||e.key==='C'||e.key==='Enter') keys.current.item=false
    }
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up)}
  },[])

  useEffect(()=>{
    const canvas=cvs.current; if(!canvas) return
    const ctx=canvas.getContext('2d')!

    function tick(){
      const gs=gsRef.current; const k=keys.current; gs.tick++
      const p=gs.player

      if(gs.gp==='bossIntro'){
        gs.introT--; if(gs.introT<=0){gs.gp='fight';setGp('fight')}
      }

      if(gs.gp==='explore'||gs.gp==='fight'){
        // Check win condition
        if(gs.zoneCleared[0]&&gs.zoneCleared[1]&&gs.zoneCleared[2]&&p.wx>W2_WIN_WX){
          gs.gp='win'; setGp('win'); raf.current=requestAnimationFrame(tick); return
        }

        // Player movement
        const moveSpd = p.stuck>0 ? P_SPD*0.4 : P_SPD
        if(k.left){p.vx=-moveSpd;p.facingRight=false}
        else if(k.right){p.vx=moveSpd;p.facingRight=true}
        else p.vx*=0.72
        if(k.up&&p.onGround){p.vy=JUMP_VEL;p.onGround=false;k.up=false}
        if(p.fireCd>0) p.fireCd--
        if(k.shoot&&p.fireCd<=0){
          p.fireCd=FIRE_RATE
          gs.projs.push({id:_pid++,wx:p.wx+(p.facingRight?36:0),y:p.y+25,vx:p.facingRight?BULLET_SPEED:-BULLET_SPEED,vy:0,type:'w2bullet',life:60,r:6,owner:'p'})
        }
        if(k.item&&p.hasItem&&gs.gp==='fight'){activateItem(gs);k.item=false}

        // Physics
        p.vy=Math.min(p.vy+GRAV,18); p.y+=p.vy; p.wx+=p.vx
        p.wx=Math.max(10,Math.min(p.wx,W2_WORLD_W-40))
        p.onGround=false
        if(p.y>=GY-60){p.y=GY-60;p.vy=0;p.onGround=true}
        if(p.vy>=0){
          for(const pl of W2_PLATS){
            if(p.wx+28>pl.wx&&p.wx+4<pl.wx+pl.w&&p.y+60>pl.y&&p.y+60<pl.y+pl.h+14){
              p.y=pl.y-60;p.vy=0;p.onGround=true
            }
          }
        }
        if(Math.abs(p.vx)>0.4){if(++p.wTick>=6){p.wTick=0;p.wFrame=(p.wFrame+1)%6}}
        if(p.invincible>0) p.invincible--
        if(p.stuck>0) p.stuck--

        // Zone entry check
        if(gs.gp==='explore'){
          for(let i=0;i<3;i++){
            if(!gs.zoneCleared[i]&&p.wx>=W2_ZONES[i].left&&p.wx<=W2_ZONES[i].right&&gs.zoneIdx!==i){
              gs.zoneIdx=i; gs.boss=initW2Boss(i); gs.clones=[]; gs.clonesActive=false
              gs.projs=gs.projs.filter(pr=>pr.owner==='p')
              gs.gp='bossIntro'; gs.introT=140
              const bd=W2_BOSSES[i]
              setIntroName(bd.name); setIntroSub(bd.sub); setIntroCol(bd.col)
              setGp('bossIntro')
              break
            }
          }
        }

        // Barrier clamping
        if(gs.gp==='fight'&&gs.boss&&gs.boss.hp>0&&gs.zoneIdx>=0){
          const zone=W2_ZONES[gs.zoneIdx]
          if(p.wx<zone.left+28) p.wx=zone.left+28
          if(p.wx>zone.right-28) p.wx=zone.right-28
        }

        if(gs.gp==='fight'){
          // Clone timer
          if(gs.clonesActive){
            gs.cloneTimer--
            if(gs.cloneTimer<=0||gs.clones.every(c=>!c.isReal||c.hp<=0)){
              gs.clonesActive=false; gs.clones=[]
            }
            // Update clone hitflash
            for(const cl of gs.clones) if(cl.hitFlash>0) cl.hitFlash--
          }

          w2BossAct(gs)
          // Update projs
          const {projs:kept,hitPlayer,stuckHit}=w2UpdateProjs(gs.projs,p,gs.camX)
          gs.projs=kept
          if(hitPlayer){p.hp=Math.max(0,p.hp-1);p.invincible=70}
          if(stuckHit&&p.stuck<=0) p.stuck=180
          // Check player bullets vs boss/clones
          const bossKilled=w2CheckPlayerBullets(gs)
          setHpDisp(p.hp)

          // Ground item pickup
          if(gs.groundItem&&!p.hasItem){
            if(Math.abs(p.wx-gs.groundItem.wx)<40&&Math.abs(p.y-gs.groundItem.y)<50){
              p.hasItem=true; p.itemType=gs.groundItem.type; gs.groundItem=null
            }
          }

          if(p.hp<=0){gs.gp='lost';setGp('lost')}
          else if(bossKilled||(!gs.clonesActive&&gs.boss&&gs.boss.hp<=0)){
            if(gs.boss) gs.boss.hp=0
            gs.clonesActive=false; gs.clones=[]
            gs.gp='quiz'; gs.quizZone=gs.zoneIdx
            setQuizZoneDisp(gs.zoneIdx); setGp('quiz')
            setQuizIn(false); requestAnimationFrame(()=>setQuizIn(true))
          }
        }

        // Update particles
        gs.particles=gs.particles.filter(p2=>{
          p2.wx+=p2.vx; p2.y+=p2.vy; p2.vy+=0.1; p2.life--; return p2.life>0
        })
      }

      // Camera
      const targetCam=Math.max(0,Math.min(p.wx-280,W2_WORLD_W-W))
      gs.camX+=(targetCam-gs.camX)*0.1

      // Render
      ctx.clearRect(0,0,W,H)
      const camCX=gs.camX+W/2
      drawW2BG(ctx,gs.camX,gs.tick)
      for(const pl of W2_PLATS) drawW2Plat(ctx,pl,gs.camX,camCX)
      drawW2Barriers(ctx,gs)
      if(gs.groundItem) drawW2GroundItem(ctx,gs.groundItem,gs.tick,gs.camX)
      drawW2Projs(ctx,gs.projs,gs.camX)
      if(gs.boss&&gs.boss.hp>0&&!gs.clonesActive) drawW2Boss(ctx,gs.boss,gs.zoneIdx,gs.tick,gs.camX)
      if(gs.clonesActive) drawW2Clones(ctx,gs.clones,gs.tick,gs.camX)
      drawW2Particles(ctx,gs.particles,gs.camX)
      drawW2Player(ctx,p,gs.tick,gs.camX)
      if(gs.boss&&gs.boss.hp>0) drawW2BossHP(ctx,gs.boss,gs.zoneIdx)
      drawW2HUD(ctx,p,gs)

      // Scanlines
      for(let y=0;y<H;y+=3){ctx.fillStyle='rgba(0,0,0,0.018)';ctx.fillRect(0,y,W,1)}
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.85)
      vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(0,0,0,0.38)')
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)

      raf.current=requestAnimationFrame(tick)
    }
    raf.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf.current)
  },[])

  const handleChoice=useCallback((idx:number)=>{
    if(quizRes) return
    const bd=W2_BOSSES[gsRef.current.quizZone]
    const ch=bd.quiz.choices[idx]
    setQuizRes({ok:ch.ok,why:ch.why})
    if(ch.ok){
      gsRef.current.xp+=150; setXpDisp(gsRef.current.xp)
    } else {
      if(gsRef.current.boss) gsRef.current.boss.hp=Math.min(gsRef.current.boss.maxHp||1,(gsRef.current.boss.hp||0)+6)
      gsRef.current.player.hp=Math.max(0,gsRef.current.player.hp-1)
      setHpDisp(gsRef.current.player.hp)
    }
  },[quizRes])

  const handleQuizContinue=useCallback(()=>{
    const gs=gsRef.current
    if(!quizRes) return
    if(quizRes.ok){
      const zi=gs.quizZone as 0|1|2
      gs.zoneCleared[zi]=true
      gs.boss=null; gs.zoneIdx=-1; gs.groundItem=null
      gs.projs=[]
      const cleared=gs.zoneCleared.filter(Boolean).length
      if(cleared>=3){gs.gp='explore';setGp('explore')}
      else{gs.gp='explore';setGp('explore')}
    } else {
      if(gs.player.hp<=0){gs.gp='lost';setGp('lost')}
      else{gs.gp='fight';setGp('fight')}
    }
    setQuizRes(null); setQuizIn(false)
  },[quizRes])

  const touchKey=(k:keyof typeof keys.current,v:boolean)=>{keys.current[k]=v}

  const bd=W2_BOSSES[quizZoneDisp]

  return (
    <div style={{width:'100vw',height:'100vh',background:'#050508',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',fontFamily:"'Fredoka Variable',sans-serif"}}>
      <div style={{position:'relative',border:'4px solid #1A0800',borderRadius:'10px',boxShadow:'0 0 0 3px #00EEFF,0 0 0 6px #1A0800,12px 12px 40px rgba(0,0,0,0.95)'}}>
        <canvas ref={cvs} width={W} height={H} style={{display:'block'}}/>

        {gp==='bossIntro'&&(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',background:'rgba(0,0,0,0.35)'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',letterSpacing:'0.3em',color:'#00EEFF',marginBottom:6,opacity:0.9}}>BOSS ZONE ENTERED</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'3.2rem',lineHeight:1,color:'white',textShadow:`4px 4px 0 #1A0800,6px 6px 0 ${introCol}`,marginBottom:8}}>{introName}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1rem',color:introCol,textShadow:'2px 2px 0 #1A0800'}}>{introSub}</div>
            </div>
          </div>
        )}

        {gp==='quiz'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:22,padding:'28px 32px',maxWidth:460,width:'100%',boxShadow:'8px 8px 0 #1A0800',transform:quizIn?'scale(1) translateY(0)':'scale(0.85) translateY(20px)',opacity:quizIn?1:0,transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s'}}>
              <div style={{textAlign:'center',marginBottom:14}}>
                <span style={{background:bd?.col||'#FFCD00',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.65rem',letterSpacing:'0.14em',padding:'3px 14px',borderRadius:9999,border:'2px solid #1A0800',boxShadow:'2px 2px 0 #1A0800'}}>⚡ BOSS DEFEATED — ANSWER TO ESCAPE!</span>
              </div>
              <p style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.05rem',lineHeight:1.35,textAlign:'center',marginBottom:18,color:'#1A0800'}}>{bd?.quiz.q}</p>
              {!quizRes?(
                <div style={{display:'flex',flexDirection:'column',gap:9}}>
                  {bd?.quiz.choices.map((ch,i)=>(
                    <button key={i} onClick={()=>handleChoice(i)} style={{padding:'11px 18px',border:'3px solid #1A0800',borderRadius:14,background:'white',fontFamily:"'Fredoka Variable',sans-serif",fontWeight:600,fontSize:'0.88rem',cursor:'pointer',textAlign:'left',boxShadow:'3px 3px 0 #1A0800',transition:'transform 0.1s,box-shadow 0.1s',lineHeight:1.35}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='5px 5px 0 #1A0800'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='3px 3px 0 #1A0800'}}
                    >{ch.t}</button>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'3rem',marginBottom:6}}>{quizRes.ok?'🎉':'😬'}</div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.2rem',color:quizRes.ok?'#2D9A4E':'#E63946',marginBottom:6}}>{quizRes.ok?`Zone cleared! +150 XP`:`Wrong! Boss heals. −1 HP`}</div>
                  <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.88rem',color:'#555',marginBottom:18,lineHeight:1.55}}>{quizRes.why}</p>
                  <button onClick={handleQuizContinue} style={{padding:'12px 36px',border:'3px solid #1A0800',borderRadius:9999,background:quizRes.ok?'#FFCD00':'#E63946',color:'#1A0800',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>
                    {quizRes.ok?'Continue! →':(hpDisp<=0?'Game Over...':'Fight On! →')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {gp==='win'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:26,padding:44,textAlign:'center',boxShadow:'8px 8px 0 #1A0800'}}>
              <div style={{fontSize:'4rem',marginBottom:10}}>🏆</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:8,color:'#1A0800'}}>Boss Gauntlet Complete!</h2>
              <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.9rem',color:'#555',marginBottom:16,lineHeight:1.5}}>You defeated inflation, debt, and market manipulation!<br/>Financial literacy: UNLOCKED</p>
              <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:14}}>{[0,1,2].map(i=><span key={i} style={{fontSize:'2.4rem',opacity:xpDisp>i*150?1:0.25}}>⭐</span>)}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.5rem',background:'#1A0800',color:'#FFCD00',borderRadius:14,padding:'10px 28px',marginBottom:24,display:'inline-block'}}>{xpDisp} XP</div>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initW2GS();setGp('explore');setHpDisp(3);setXpDisp(0);setQuizRes(null)}} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:9999,background:'#FFCD00',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>Play Again</button>
                <button onClick={onBack} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:9999,background:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>← Back</button>
              </div>
            </div>
          </div>
        )}

        {gp==='lost'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#1A0800',border:'4px solid #E63946',borderRadius:26,padding:44,textAlign:'center',boxShadow:'8px 8px 0 #E63946'}}>
              <div style={{fontSize:'4rem',marginBottom:10}}>💀</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:8,color:'#E63946'}}>Wiped Out!</h2>
              <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.95rem',color:'rgba(255,255,255,0.7)',marginBottom:24,lineHeight:1.5}}>The financial villains got you.<br/>Learn from it and try again!</p>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initW2GS();setGp('explore');setHpDisp(3);setXpDisp(0);setQuizRes(null)}} style={{padding:'13px 28px',border:'3px solid #E63946',borderRadius:9999,background:'#E63946',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #C62828'}}>Try Again</button>
                <button onClick={onBack} style={{padding:'13px 28px',border:'3px solid #555',borderRadius:9999,background:'#333',color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #111'}}>← Back</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
        {(['left','right'] as const).map(d=>(
          <button key={d} onPointerDown={()=>touchKey(d,true)} onPointerUp={()=>touchKey(d,false)} onPointerLeave={()=>touchKey(d,false)}
            style={{width:54,height:54,border:'3px solid #00EEFF',borderRadius:14,background:'rgba(0,238,255,0.1)',color:'#00EEFF',fontSize:'1.4rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {d==='left'?'◀':'▶'}</button>
        ))}
        <button onPointerDown={()=>touchKey('up',true)} onPointerUp={()=>touchKey('up',false)} onPointerLeave={()=>touchKey('up',false)}
          style={{width:54,height:54,border:'3px solid #5DC264',borderRadius:9999,background:'rgba(93,194,100,0.12)',color:'#5DC264',fontSize:'1.6rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>↑</button>
        <button onPointerDown={()=>touchKey('shoot',true)} onPointerUp={()=>touchKey('shoot',false)} onPointerLeave={()=>touchKey('shoot',false)}
          style={{width:54,height:54,border:'3px solid #FFCD00',borderRadius:14,background:'rgba(255,205,0,0.2)',color:'#FFCD00',fontFamily:"'Fredoka One',cursive",fontSize:'1rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>SHOOT</button>
        <button onPointerDown={()=>touchKey('item',true)} onPointerUp={()=>touchKey('item',false)} onPointerLeave={()=>touchKey('item',false)}
          style={{width:54,height:54,border:'3px solid #FF7B25',borderRadius:14,background:'rgba(255,123,37,0.2)',color:'#FF7B25',fontFamily:"'Fredoka One',cursive",fontSize:'1rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>ITEM</button>
      </div>
      <button onClick={onBack} style={{marginTop:8,background:'transparent',border:'none',color:'rgba(0,238,255,0.4)',fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',cursor:'pointer',letterSpacing:'0.12em'}}>← BACK</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD 3 — CITY SIDESCROLLER (Parallax walk + NPC encounters)
// ═══════════════════════════════════════════════════════════════════════════════

const W3_GRAVITY   = 0.48
const W3_JUMP_VEL  = -12.5
const W3_MOVE_SPD  = 3.8
const W3_WORLD_W   = 5200
const W3_GROUND_Y  = H - 80
const W3_CHAR_H    = 72
const W3_WALK_TICKS = 6

const W3_ENCOUNTERS = [
  {
    id: 'landlord', x: 1000, y: W3_GROUND_Y - 96, w: 70, h: 96, label: 'THE LANDLORD', color: '#E63946',
    question: 'Your landlord demands 3 months rent upfront. You should:',
    choices: [
      { text: "Pay immediately — can't risk losing the flat", correct: false, reason: "Always negotiate. 1 month deposit is the legal norm." },
      { text: 'Negotiate — 1 month deposit is standard',      correct: true,  reason: "Correct! Most countries cap deposits at 1–2 months rent." },
      { text: 'Sign the contract first, discuss money later', correct: false, reason: "Never sign without agreeing on ALL financial terms first." },
    ],
  },
  {
    id: 'cryptobro', x: 2200, y: W3_GROUND_Y - 96, w: 70, h: 96, label: 'CRYPTO BRO', color: '#7B2D8B',
    question: '"MoonSquirrel Coin is GUARANTEED to 100x!" This is:',
    choices: [
      { text: 'A great opportunity — get in early!', correct: false, reason: "No investment is ever guaranteed. Classic pump-and-dump red flag." },
      { text: 'Classic pump-and-dump scam',           correct: true,  reason: "Correct! 'Guaranteed returns' is the #1 sign of investment fraud." },
      { text: 'Risky but worth a small bet',           correct: false, reason: "You can never know future returns. Never invest more than you can lose." },
    ],
  },
  {
    id: 'hacker', x: 3600, y: W3_GROUND_Y - 96, w: 70, h: 96, label: 'THE HACKER', color: '#1565C0',
    question: 'Email from "PKO Bank" asks you to verify your login. You:',
    choices: [
      { text: 'Click the link — looks totally official',         correct: false, reason: "Phishing emails are built to look real. Always verify directly." },
      { text: 'Reply with your password to confirm identity',    correct: false, reason: "Banks NEVER ask for passwords by email. This is phishing." },
      { text: 'Delete it and log in at the official site directly', correct: true, reason: "Correct! Go directly to the bank's real URL — never via email links." },
    ],
  },
]

const W3_PLATFORMS = [
  { x: 180,  y: W3_GROUND_Y - 110, w: 150, h: 22 },
  { x: 440,  y: W3_GROUND_Y - 170, w: 120, h: 22 },
  { x: 650,  y: W3_GROUND_Y - 115, w: 180, h: 22 },
  { x: 1300, y: W3_GROUND_Y - 140, w: 140, h: 22 },
  { x: 1550, y: W3_GROUND_Y - 190, w: 110, h: 22 },
  { x: 1760, y: W3_GROUND_Y - 120, w: 160, h: 22 },
  { x: 2500, y: W3_GROUND_Y - 155, w: 130, h: 22 },
  { x: 2750, y: W3_GROUND_Y - 110, w: 150, h: 22 },
  { x: 2980, y: W3_GROUND_Y - 170, w: 120, h: 22 },
  { x: 3300, y: W3_GROUND_Y - 130, w: 140, h: 22 },
  { x: 4000, y: W3_GROUND_Y - 145, w: 130, h: 22 },
  { x: 4280, y: W3_GROUND_Y - 180, w: 100, h: 22 },
]

interface W3Player { x:number; y:number; vx:number; vy:number; onGround:boolean; facingRight:boolean; walkFrame:number; walkTick:number; hp:number; invincible:number }
interface W3Particle { x:number; y:number; vx:number; vy:number; life:number; maxLife:number; color:string; r:number }
interface W3GS { player:W3Player; camera:number; tick:number; defeated:Set<string>; xp:number; stars:number; phase:'playing'|'quiz'|'win'; encounter:typeof W3_ENCOUNTERS[0]|null }

function drawW3Bg(ctx: CanvasRenderingContext2D, camX: number) {
  const sky = ctx.createLinearGradient(0,0,0,W3_GROUND_Y)
  sky.addColorStop(0,'#4A90D9'); sky.addColorStop(1,'#C8E6F5')
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,W3_GROUND_Y)
  ctx.fillStyle='rgba(0,0,0,0.025)'
  for(let dy=6;dy<W3_GROUND_Y;dy+=12){
    for(let dx=(Math.floor(dy/12)%2===0?0:6);dx<W;dx+=12){ctx.beginPath();ctx.arc(dx,dy,1.1,0,Math.PI*2);ctx.fill()}
  }
  // Far buildings parallax 0.12
  const farColors=['#B8896A','#C99870','#D4A878','#A87858']
  const farB=[{ox:60,w:80,h:140},{ox:200,w:60,h:110},{ox:320,w:95,h:165},{ox:470,w:70,h:130},{ox:600,w:100,h:180},{ox:760,w:65,h:120},{ox:890,w:85,h:155},{ox:1040,w:75,h:142},{ox:1180,w:90,h:168},{ox:1320,w:72,h:128}]
  const tileW1=1400, p1=camX*0.12
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=2
  for(const b of farB){
    for(let rep=-1;rep<=Math.ceil(W/tileW1)+1;rep++){
      const bx=b.ox+rep*tileW1-p1
      if(bx>W+10||bx+b.w<-10) continue
      ctx.fillStyle=farColors[farB.indexOf(b)%farColors.length]
      ctx.beginPath();ctx.roundRect(bx,W3_GROUND_Y-b.h,b.w,b.h,3);ctx.fill();ctx.stroke()
      ctx.fillStyle='rgba(255,220,130,0.6)'
      for(let wy=W3_GROUND_Y-b.h+14;wy<W3_GROUND_Y-18;wy+=28){
        for(let wx=bx+7;wx<bx+b.w-10;wx+=20){ctx.fillRect(wx,wy,10,10);ctx.strokeStyle='#1A0800';ctx.lineWidth=1;ctx.strokeRect(wx,wy,10,10);ctx.lineWidth=2;ctx.strokeStyle='#1A0800'}
      }
    }
  }
  // Mid buildings parallax 0.38
  const midColors=['#E8A87C','#D4836A','#C97B58','#F0B88C']
  const midB=[{ox:30,w:110,h:205},{ox:200,w:90,h:172},{ox:360,w:130,h:225},{ox:550,w:98,h:188},{ox:710,w:120,h:215},{ox:900,w:92,h:180},{ox:1060,w:115,h:210},{ox:1240,w:105,h:198}]
  const tileW2=1300, p2=camX*0.38
  ctx.lineWidth=2.5; ctx.strokeStyle='#1A0800'
  for(const b of midB){
    for(let rep=-1;rep<=Math.ceil(W/tileW2)+2;rep++){
      const bx=b.ox+rep*tileW2-p2
      if(bx>W+10||bx+b.w<-10) continue
      ctx.fillStyle=midColors[midB.indexOf(b)%midColors.length]
      ctx.beginPath();ctx.roundRect(bx,W3_GROUND_Y-b.h,b.w,b.h,5);ctx.fill();ctx.stroke()
      ctx.fillStyle='#FFCD00'; ctx.strokeStyle='#1A0800'; ctx.lineWidth=1.5
      for(let wy=W3_GROUND_Y-b.h+18;wy<W3_GROUND_Y-24;wy+=34){
        for(let wx=bx+9;wx<bx+b.w-14;wx+=26){ctx.fillRect(wx,wy,13,13);ctx.strokeRect(wx,wy,13,13)}
      }
      ctx.lineWidth=2.5; ctx.strokeStyle='#1A0800'
    }
  }
  // Ground
  ctx.fillStyle='#7B5E2A'; ctx.fillRect(0,W3_GROUND_Y,W,H-W3_GROUND_Y)
  ctx.fillStyle='#5DC264'; ctx.fillRect(0,W3_GROUND_Y,W,20)
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=3
  ctx.beginPath();ctx.moveTo(0,W3_GROUND_Y);ctx.lineTo(W,W3_GROUND_Y);ctx.stroke()
  ctx.lineWidth=2; ctx.beginPath();ctx.moveTo(0,W3_GROUND_Y+20);ctx.lineTo(W,W3_GROUND_Y+20);ctx.stroke()
}

function drawW3Platform(ctx: CanvasRenderingContext2D, p: typeof W3_PLATFORMS[0], camX: number) {
  const sx=p.x-camX; if(sx>W+60||sx+p.w<-60) return
  ctx.fillStyle='#7B5E2A'; ctx.strokeStyle='#1A0800'; ctx.lineWidth=2.5
  ctx.beginPath();ctx.roundRect(sx,p.y,p.w,p.h,7);ctx.fill();ctx.stroke()
  ctx.fillStyle='#5DC264'
  ctx.beginPath();ctx.roundRect(sx,p.y,p.w,11,[7,7,0,0]);ctx.fill()
  ctx.strokeStyle='#1A0800'; ctx.lineWidth=1.5
  ctx.beginPath();ctx.moveTo(sx,p.y+11);ctx.lineTo(sx+p.w,p.y+11);ctx.stroke()
}

function drawW3Frog(ctx: CanvasRenderingContext2D, player: W3Player, camX: number) {
  const sx=player.x-camX, sy=player.y
  ctx.save()
  if(!player.facingRight){ctx.translate(sx+16,0);ctx.scale(-1,1);ctx.translate(-(sx+16),0)}
  const bobY=player.onGround&&Math.abs(player.vx)>0.3?Math.sin(player.walkFrame*Math.PI/3)*2.5:0
  const legSwing=Math.sin(player.walkFrame*Math.PI/3)*16
  const bx=sx, by=sy+bobY
  const drawLeg=(offX:number,swingDir:number)=>{
    ctx.save();ctx.translate(bx+offX,by+50);ctx.rotate(swingDir*legSwing*Math.PI/180)
    ctx.strokeStyle='#3A9E42';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.stroke()
    ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.stroke()
    ctx.fillStyle='#3A9E42';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
    ctx.beginPath();ctx.ellipse(0,20,9,5,0,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.restore()
  }
  drawLeg(8,1); drawLeg(24,-1)
  ctx.fillStyle='#5DC264';ctx.strokeStyle='#1A0800';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(bx+16,by+38,17,15,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  const drawBTHalf=(dx:number,flip:number)=>{
    ctx.save();ctx.translate(bx+16,by+50);ctx.scale(flip,1)
    ctx.fillStyle='#E63946';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(8,-4);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()
  }
  drawBTHalf(-8,-1); drawBTHalf(8,1)
  ctx.fillStyle='#C62828';ctx.beginPath();ctx.arc(bx+16,by+50,3.5,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#5DC264';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.ellipse(bx+8,by+17,8,8,-0.15,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.ellipse(bx+24,by+17,8,8,0.15,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#5DC264';ctx.strokeStyle='#1A0800';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(bx+16,by+27,19,17,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  const drawEye=(ex:number,ey:number)=>{
    ctx.fillStyle='white';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
    ctx.beginPath();ctx.arc(ex,ey,6.5,0,Math.PI*2);ctx.fill();ctx.stroke()
    ctx.fillStyle='#1A0800';ctx.beginPath();ctx.arc(ex+1,ey-1,3.5,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='white';ctx.beginPath();ctx.arc(ex+2,ey-2,1.2,0,Math.PI*2);ctx.fill()
  }
  drawEye(bx+8,by+17); drawEye(bx+24,by+17)
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx+16,by+30,7,0.15,Math.PI-0.15);ctx.stroke()
  if(player.invincible>0&&Math.floor(player.invincible/4)%2===0){
    ctx.fillStyle='rgba(255,80,80,0.45)';ctx.beginPath();ctx.ellipse(bx+16,by+36,22,32,0,0,Math.PI*2);ctx.fill()
  }
  ctx.restore()
}

function drawW3Landlord(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle='#1A0800'
  ctx.fillStyle='#FFB3BA';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(x+35,y+56,28,25,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.ellipse(x+35,y+25,25,23,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1A0800';ctx.lineWidth=2
  ctx.fillRect(x+21,y+9,27,6);ctx.strokeRect(x+21,y+9,27,6)
  ctx.fillRect(x+26,y+2,18,9);ctx.strokeRect(x+26,y+2,18,9)
  ctx.fillStyle='white';ctx.lineWidth=1.5
  ctx.beginPath();ctx.arc(x+27,y+22,7.5,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.arc(x+43,y+22,7.5,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#2D9A4E';ctx.font='bold 10px sans-serif';ctx.textAlign='center'
  ctx.fillText('$',x+27,y+26);ctx.fillText('$',x+43,y+26);ctx.textAlign='left'
  ctx.fillStyle='#FF8FA0';ctx.lineWidth=2
  ctx.beginPath();ctx.ellipse(x+35,y+33,10,7,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#C62828'
  ctx.beginPath();ctx.arc(x+30,y+33,2,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.arc(x+40,y+33,2,0,Math.PI*2);ctx.fill()
  ctx.lineWidth=5;ctx.strokeStyle='#FFB3BA'
  ctx.beginPath();ctx.moveTo(x+9,y+48);ctx.lineTo(x+2,y+64);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+61,y+48);ctx.lineTo(x+68,y+64);ctx.stroke()
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(x+9,y+48);ctx.lineTo(x+2,y+64);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+61,y+48);ctx.lineTo(x+68,y+64);ctx.stroke()
  ctx.fillStyle='#FFCD00';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.arc(x+68,y+68,10,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1A0800';ctx.font='bold 11px sans-serif';ctx.textAlign='center'
  ctx.fillText('$',x+68,y+73);ctx.textAlign='left'
  ctx.strokeStyle='#1A0800';ctx.lineWidth=4
  ctx.beginPath();ctx.moveTo(x+24,y+76);ctx.lineTo(x+18,y+92);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+46,y+76);ctx.lineTo(x+52,y+92);ctx.stroke()
  ctx.fillStyle='#1A0800'
  ctx.beginPath();ctx.ellipse(x+16,y+95,11,5,-0.2,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.ellipse(x+54,y+95,11,5,0.2,0,Math.PI*2);ctx.fill()
}

function drawW3CryptoBro(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle='#1A0800'
  ctx.fillStyle='#9B59B6';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(x+35,y+57,27,24,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#7B2D8B';ctx.font='18px sans-serif';ctx.textAlign='center'
  ctx.fillText('🌙',x+35,y+64);ctx.textAlign='left'
  ctx.strokeStyle='#1A0800';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(x+35,y+57,27,24,0,0,Math.PI*2);ctx.stroke()
  ctx.fillStyle='#FDBCB4';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(x+35,y+26,22,21,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1A0800'
  for(let i=0;i<5;i++){const hx=x+16+i*8;ctx.beginPath();ctx.moveTo(hx-4,y+15);ctx.lineTo(hx,y+4);ctx.lineTo(hx+4,y+15);ctx.closePath();ctx.fill()}
  ctx.fillStyle='#1A0800'
  ctx.beginPath();ctx.roundRect(x+16,y+21,13,9,3);ctx.fill()
  ctx.beginPath();ctx.roundRect(x+31,y+21,13,9,3);ctx.fill()
  ctx.strokeStyle='#555';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+29,y+25);ctx.lineTo(x+31,y+25);ctx.stroke()
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(x+13,y+25);ctx.lineTo(x+16,y+25);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+44,y+25);ctx.lineTo(x+57,y+25);ctx.stroke()
  ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+37,y+37,6,0.1,Math.PI*0.8);ctx.stroke()
  ctx.lineWidth=5;ctx.strokeStyle='#9B59B6'
  ctx.beginPath();ctx.moveTo(x+10,y+48);ctx.quadraticCurveTo(x+4,y+64,x+8,y+74);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+60,y+48);ctx.quadraticCurveTo(x+66,y+64,x+62,y+74);ctx.stroke()
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(x+10,y+48);ctx.quadraticCurveTo(x+4,y+64,x+8,y+74);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+60,y+48);ctx.quadraticCurveTo(x+66,y+64,x+62,y+74);ctx.stroke()
  ctx.fillStyle='#222';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
  ctx.beginPath();ctx.roundRect(x+59,y+70,11,17,2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#00FF88';ctx.font='6px monospace';ctx.fillText('↑↑',x+61,y+81)
  ctx.strokeStyle='#1A0800';ctx.lineWidth=4
  ctx.beginPath();ctx.moveTo(x+24,y+75);ctx.lineTo(x+18,y+93);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+46,y+75);ctx.lineTo(x+52,y+93);ctx.stroke()
  ctx.fillStyle='#7B2D8B';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.ellipse(x+16,y+96,11,5,-0.2,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.ellipse(x+54,y+96,11,5,0.2,0,Math.PI*2);ctx.fill();ctx.stroke()
}

function drawW3Hacker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle='#1A0800'
  ctx.fillStyle='#1E1E3F';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(x+35,y+56,28,24,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#FDBCB4'
  ctx.beginPath();ctx.ellipse(x+35,y+25,22,20,0,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.fillStyle='#1E1E3F';ctx.lineWidth=2
  ctx.beginPath();ctx.arc(x+35,y+18,28,Math.PI+0.25,-0.25);ctx.lineTo(x+35,y+10);ctx.closePath();ctx.fill();ctx.stroke()
  ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(x+19,y+28,32,17,5);ctx.fill()
  ctx.fillStyle='#00FF88';ctx.shadowColor='#00FF88';ctx.shadowBlur=10
  ctx.beginPath();ctx.arc(x+27,y+24,5,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.arc(x+43,y+24,5,0,Math.PI*2);ctx.fill()
  ctx.shadowBlur=0
  ctx.lineWidth=5;ctx.strokeStyle='#1E1E3F'
  ctx.beginPath();ctx.moveTo(x+9,y+46);ctx.lineTo(x+4,y+64);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+61,y+46);ctx.lineTo(x+66,y+64);ctx.stroke()
  ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(x+9,y+46);ctx.lineTo(x+4,y+64);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+61,y+46);ctx.lineTo(x+66,y+64);ctx.stroke()
  ctx.fillStyle='#2C2C54';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(x+8,y+60,32,21,3);ctx.fill();ctx.stroke()
  ctx.fillStyle='#00FF88';ctx.font='6px monospace'
  ctx.fillText('0x1f',x+12,y+70); ctx.fillText('null',x+12,y+78)
  ctx.strokeStyle='#1A0800';ctx.lineWidth=4
  ctx.beginPath();ctx.moveTo(x+24,y+74);ctx.lineTo(x+17,y+92);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x+46,y+74);ctx.lineTo(x+53,y+92);ctx.stroke()
  ctx.fillStyle='#1E1E3F';ctx.strokeStyle='#1A0800';ctx.lineWidth=2
  ctx.beginPath();ctx.ellipse(x+15,y+95,11,5,-0.2,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.beginPath();ctx.ellipse(x+55,y+95,11,5,0.2,0,Math.PI*2);ctx.fill();ctx.stroke()
}

function drawW3Enemy(ctx: CanvasRenderingContext2D, enc: typeof W3_ENCOUNTERS[0], camX: number, defeated: boolean, tick: number) {
  const sx=enc.x-camX; if(sx>W+100||sx<-100) return
  if(defeated){
    ctx.fillStyle='#FFCD00'
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+tick*0.05, r=22+Math.sin(tick*0.1+i)*6
      ctx.beginPath();ctx.arc(sx+enc.w/2+Math.cos(a)*r,enc.y+enc.h/2+Math.sin(a)*r*0.5,5,0,Math.PI*2);ctx.fill()
    }
    ctx.fillStyle='#5DC264';ctx.font="bold 24px 'Fredoka One',cursive";ctx.textAlign='center'
    ctx.fillText('✓',sx+enc.w/2,enc.y+enc.h/2+8);ctx.textAlign='left'; return
  }
  const bounce=Math.sin(tick*0.05)*4
  ctx.fillStyle='rgba(0,0,0,0.15)'
  ctx.beginPath();ctx.ellipse(sx+enc.w/2,enc.y+enc.h+4,enc.w*0.5,7,0,0,Math.PI*2);ctx.fill()
  ctx.save();ctx.translate(sx,bounce)
  if(enc.id==='landlord') drawW3Landlord(ctx,0,enc.y-bounce)
  else if(enc.id==='cryptobro') drawW3CryptoBro(ctx,0,enc.y-bounce)
  else drawW3Hacker(ctx,0,enc.y-bounce)
  ctx.restore()
  ctx.font="bold 11px 'Fredoka One',cursive";ctx.textAlign='center'
  const tw=ctx.measureText(enc.label).width
  const lx=sx+enc.w/2, ly=enc.y-18+Math.sin(tick*0.04)*3
  ctx.fillStyle=enc.color;ctx.strokeStyle='#1A0800';ctx.lineWidth=2.5
  ctx.beginPath();ctx.roundRect(lx-tw/2-9,ly-15,tw+18,22,7);ctx.fill();ctx.stroke()
  ctx.fillStyle='white';ctx.fillText(enc.label,lx,ly);ctx.textAlign='left'
}

function drawW3Goal(ctx: CanvasRenderingContext2D, camX: number, tick: number) {
  const gx=W3_WORLD_W-100-camX; if(gx>W+120||gx<-120) return
  ctx.fillStyle='#7B5E2A';ctx.strokeStyle='#1A0800';ctx.lineWidth=2.5
  ctx.fillRect(gx+15,W3_GROUND_Y-210,9,210);ctx.strokeRect(gx+15,W3_GROUND_Y-210,9,210)
  const wave=Math.sin(tick*0.09)*12
  ctx.fillStyle='#FFCD00';ctx.lineWidth=2;ctx.strokeStyle='#1A0800'
  ctx.beginPath()
  ctx.moveTo(gx+24,W3_GROUND_Y-210)
  ctx.quadraticCurveTo(gx+56+wave,W3_GROUND_Y-190,gx+60+wave,W3_GROUND_Y-175)
  ctx.quadraticCurveTo(gx+56+wave,W3_GROUND_Y-158,gx+24,W3_GROUND_Y-148)
  ctx.closePath();ctx.fill();ctx.stroke()
  ctx.font='16px sans-serif';ctx.textAlign='center'
  ctx.fillText('🏁',gx+42+wave*0.5,W3_GROUND_Y-171);ctx.textAlign='left'
}

function drawW3HUD(ctx: CanvasRenderingContext2D, hp: number, xp: number, defeated: number) {
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(12,12,130,36,10);ctx.fill();ctx.stroke()
  for(let i=0;i<3;i++){ctx.fillStyle=hp>i?'#E63946':'#444';ctx.font='22px sans-serif';ctx.fillText('♥',20+i*40,38)}
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.lineWidth=2
  ctx.beginPath();ctx.roundRect(W-138,12,126,36,10);ctx.fill();ctx.stroke()
  ctx.fillStyle='#FFCD00';ctx.font="bold 15px 'Fredoka One',cursive";ctx.textAlign='right'
  ctx.fillText(`⭐ ${xp} XP`,W-16,35);ctx.textAlign='left'
  const bx=16,by=H-32,bw=W-32,bh=16
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.strokeStyle='#FFCD00';ctx.lineWidth=1.5
  ctx.beginPath();ctx.roundRect(bx-2,by-2,bw+4,bh+4,8);ctx.fill()
  ctx.fillStyle='#1A0800';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,6);ctx.fill();ctx.stroke()
  const progress=Math.min(defeated/3,1)
  ctx.fillStyle='#FFCD00'
  if(progress>0){ctx.beginPath();ctx.roundRect(bx,by,bw*progress,bh,6);ctx.fill()}
  ctx.strokeStyle='#FFCD00';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,6);ctx.stroke()
  for(const enc of W3_ENCOUNTERS){
    const mx=bx+(enc.x/W3_WORLD_W)*bw
    ctx.fillStyle=defeated>=W3_ENCOUNTERS.indexOf(enc)+1?'#5DC264':enc.color
    ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
    ctx.beginPath();ctx.arc(mx,by+bh/2,7,0,Math.PI*2);ctx.fill();ctx.stroke()
  }
  ctx.fillStyle='#FFCD00';ctx.strokeStyle='#1A0800';ctx.lineWidth=1.5
  ctx.beginPath();ctx.arc(bx+bw-5,by+bh/2,6,0,Math.PI*2);ctx.fill();ctx.stroke()
  ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#1A0800'
  ctx.fillText('★',bx+bw-5,by+bh/2+3);ctx.textAlign='left'
}

function drawW3Grain(ctx: CanvasRenderingContext2D, tick: number) {
  for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,0.025)';ctx.fillRect(0,y,W,1)}
  const vig=ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.85)
  vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(0,0,0,0.4)')
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)
  if(tick%3===0){
    for(let i=0;i<180;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.035})`;ctx.fillRect(Math.random()*W,Math.random()*H,1.5,1.5)}
  }
}

function updateW3Particles(particles: W3Particle[]): W3Particle[] {
  return particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.22;p.life--;return p.life>0})
}
function drawW3Particles(ctx: CanvasRenderingContext2D, particles: W3Particle[], camX: number) {
  for(const p of particles){ctx.fillStyle=p.color;ctx.globalAlpha=p.life/p.maxLife;ctx.beginPath();ctx.arc(p.x-camX,p.y,p.r,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1
}

function initW3GS(): W3GS {
  return {
    player:{x:60,y:W3_GROUND_Y-W3_CHAR_H,vx:0,vy:0,onGround:true,facingRight:true,walkFrame:0,walkTick:0,hp:3,invincible:0},
    camera:0,tick:0,defeated:new Set(),xp:0,stars:0,phase:'playing',encounter:null,
  }
}

function CitySidescroller({ onBack }: { onBack: () => void }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef(0)
  const particlesRef = useRef<W3Particle[]>([])
  const keysRef      = useRef({left:false,right:false,up:false})
  const gsRef        = useRef<W3GS>(initW3GS())

  const [phase,        setPhase]        = useState<'playing'|'quiz'|'win'>('playing')
  const [encounter,    setEncounter]    = useState<typeof W3_ENCOUNTERS[0]|null>(null)
  const [choiceResult, setChoiceResult] = useState<{correct:boolean;reason:string}|null>(null)
  const [xpDisplay,    setXpDisplay]    = useState(0)
  const [hpDisplay,    setHpDisplay]    = useState(3)
  const [showHint,     setShowHint]     = useState(true)
  const [quizAnim,     setQuizAnim]     = useState(false)

  useEffect(()=>{
    const dn=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a') keysRef.current.left=true
      if(e.key==='ArrowRight'||e.key==='d') keysRef.current.right=true
      if((e.key==='ArrowUp'||e.key==='w'||e.key===' ')&&!keysRef.current.up) keysRef.current.up=true
      if(e.key!==' ') setShowHint(false)
      if(e.key===' ') e.preventDefault()
    }
    const up=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a') keysRef.current.left=false
      if(e.key==='ArrowRight'||e.key==='d') keysRef.current.right=false
      if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keysRef.current.up=false
    }
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up)}
  },[])

  const triggerQuiz=useCallback((enc:typeof W3_ENCOUNTERS[0])=>{
    setEncounter(enc);setChoiceResult(null);setPhase('quiz')
    requestAnimationFrame(()=>setQuizAnim(true))
  },[])

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d')!
    function tick(){
      const gs=gsRef.current, k=keysRef.current
      if(gs.phase!=='playing'){rafRef.current=requestAnimationFrame(tick);return}
      gs.tick++
      const p=gs.player
      if(k.left){p.vx=-W3_MOVE_SPD;p.facingRight=false}
      else if(k.right){p.vx=W3_MOVE_SPD;p.facingRight=true}
      else p.vx*=0.72
      if(k.up&&p.onGround){p.vy=W3_JUMP_VEL;p.onGround=false;k.up=false}
      p.vy=Math.min(p.vy+W3_GRAVITY,18); p.y+=p.vy; p.x+=p.vx
      p.x=Math.max(10,Math.min(p.x,W3_WORLD_W-50))
      p.onGround=false
      if(p.y>=W3_GROUND_Y-W3_CHAR_H){p.y=W3_GROUND_Y-W3_CHAR_H;p.vy=0;p.onGround=true}
      if(p.vy>=0){
        for(const pl of W3_PLATFORMS){
          if(p.x+28>pl.x&&p.x+4<pl.x+pl.w&&p.y+W3_CHAR_H>pl.y&&p.y+W3_CHAR_H<pl.y+pl.h+14){
            p.y=pl.y-W3_CHAR_H;p.vy=0;p.onGround=true
          }
        }
      }
      if(Math.abs(p.vx)>0.4){if(++p.walkTick>=W3_WALK_TICKS){p.walkTick=0;p.walkFrame=(p.walkFrame+1)%6}}
      if(p.invincible>0) p.invincible--
      const targetCam=Math.max(0,Math.min(p.x-W*0.38,W3_WORLD_W-W))
      gs.camera+=(targetCam-gs.camera)*0.12
      for(const enc of W3_ENCOUNTERS){
        if(gs.defeated.has(enc.id)) continue
        if(p.x+32>enc.x&&p.x<enc.x+enc.w&&p.y+W3_CHAR_H>enc.y){gs.phase='quiz';gs.encounter=enc;triggerQuiz(enc);return}
      }
      if(p.x>=W3_WORLD_W-120){gs.phase='win';setPhase('win');return}
      particlesRef.current=updateW3Particles(particlesRef.current)
      ctx.clearRect(0,0,W,H)
      drawW3Bg(ctx,gs.camera)
      for(const pl of W3_PLATFORMS) drawW3Platform(ctx,pl,gs.camera)
      drawW3Goal(ctx,gs.camera,gs.tick)
      for(const enc of W3_ENCOUNTERS) drawW3Enemy(ctx,enc,gs.camera,gs.defeated.has(enc.id),gs.tick)
      drawW3Particles(ctx,particlesRef.current,gs.camera)
      drawW3Frog(ctx,p,gs.camera)
      drawW3HUD(ctx,p.hp,gs.xp,gs.defeated.size)
      drawW3Grain(ctx,gs.tick)
      rafRef.current=requestAnimationFrame(tick)
    }
    rafRef.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(rafRef.current)
  },[triggerQuiz])

  const handleChoice=useCallback((idx:number)=>{
    if(choiceResult||!encounter) return
    const ch=encounter.choices[idx]
    setChoiceResult({correct:ch.correct,reason:ch.reason})
    const gs=gsRef.current
    if(ch.correct){
      gs.defeated.add(encounter.id);gs.xp+=100;gs.stars++;setXpDisplay(gs.xp)
      for(let i=0;i<24;i++){
        const a=(i/24)*Math.PI*2, sp=4+Math.random()*5
        particlesRef.current.push({x:encounter.x+35,y:encounter.y+40,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-5,life:55,maxLife:55,color:['#FFCD00','#E63946','#5DC264','#7B2D8B','#FF7B25'][i%5],r:4+Math.random()*4})
      }
    } else {
      gs.player.hp=Math.max(0,gs.player.hp-1);gs.player.invincible=60;setHpDisplay(gs.player.hp)
    }
  },[encounter,choiceResult])

  const dismissQuiz=useCallback(()=>{
    const gs=gsRef.current
    gs.player.x-=100;gs.player.vx=-5;gs.phase='playing';gs.encounter=null
    setQuizAnim(false);setTimeout(()=>{setPhase('playing');setEncounter(null);setChoiceResult(null)},80)
  },[])

  const touchKey=(dir:'left'|'right'|'up',v:boolean)=>{keysRef.current[dir]=v;if(v)setShowHint(false)}

  return (
    <div style={{width:'100vw',height:'100vh',background:'#0D0507',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',fontFamily:"'Fredoka Variable',sans-serif"}}>
      <div style={{position:'relative',border:'4px solid #1A0800',borderRadius:'10px',boxShadow:'0 0 0 3px #FFCD00,0 0 0 6px #1A0800,12px 12px 40px rgba(0,0,0,0.9)'}}>
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block'}}/>
        {showHint&&phase==='playing'&&(
          <div style={{position:'absolute',bottom:54,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.75)',color:'#FFCD00',padding:'8px 22px',borderRadius:'9999px',fontFamily:"'Fredoka One',cursive",fontSize:'0.82rem',whiteSpace:'nowrap',border:'2px solid #FFCD00',pointerEvents:'none',letterSpacing:'0.04em'}}>
            ← → Move &nbsp;·&nbsp; ↑ / Space Jump &nbsp;·&nbsp; Defeat the villains!
          </div>
        )}
        {phase==='quiz'&&encounter&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.72)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:'22px',padding:'28px 32px',maxWidth:'460px',width:'100%',boxShadow:'8px 8px 0 #1A0800',transform:quizAnim?'scale(1) translateY(0)':'scale(0.85) translateY(20px)',opacity:quizAnim?1:0,transition:'transform 0.32s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s ease'}}>
              <div style={{textAlign:'center',marginBottom:'14px'}}>
                <span style={{background:encounter.color,color:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.65rem',letterSpacing:'0.14em',padding:'3px 14px',borderRadius:'9999px',border:'2px solid #1A0800',boxShadow:'2px 2px 0 #1A0800'}}>⚡ ENCOUNTER: {encounter.label}</span>
              </div>
              <p style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.05rem',lineHeight:1.35,textAlign:'center',marginBottom:'18px',color:'#1A0800'}}>{encounter.question}</p>
              {!choiceResult?(
                <div style={{display:'flex',flexDirection:'column',gap:'9px'}}>
                  {encounter.choices.map((ch,i)=>(
                    <button key={i} onClick={()=>handleChoice(i)} style={{padding:'11px 18px',border:'3px solid #1A0800',borderRadius:'14px',background:'white',fontFamily:"'Fredoka Variable',sans-serif",fontWeight:600,fontSize:'0.88rem',cursor:'pointer',textAlign:'left',boxShadow:'3px 3px 0 #1A0800',transition:'transform 0.1s,box-shadow 0.1s',lineHeight:1.35}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='5px 5px 0 #1A0800'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='3px 3px 0 #1A0800'}}
                      onMouseDown={e=>{e.currentTarget.style.transform='translate(1px,1px)';e.currentTarget.style.boxShadow='1px 1px 0 #1A0800'}}
                    >{ch.text}</button>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'3.2rem',marginBottom:'6px'}}>{choiceResult.correct?'🎉':'😬'}</div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.25rem',color:choiceResult.correct?'#2D9A4E':'#E63946',marginBottom:'6px'}}>{choiceResult.correct?'+100 XP Earned!':'Wrong! −1 HP'}</div>
                  <p style={{fontFamily:"'Fredoka Variable',sans-serif",fontWeight:500,fontSize:'0.88rem',color:'#555',marginBottom:'18px',lineHeight:1.55}}>{choiceResult.reason}</p>
                  <button onClick={dismissQuiz} style={{padding:'12px 36px',border:'3px solid #1A0800',borderRadius:'9999px',background:choiceResult.correct?'#FFCD00':'#E63946',color:'#1A0800',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800',transition:'transform 0.1s'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.transform=''}}
                  >{choiceResult.correct?'Keep Going! →':'Try Again! →'}</button>
                </div>
              )}
            </div>
          </div>
        )}
        {phase==='win'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#FEF9EE',border:'4px solid #1A0800',borderRadius:'26px',padding:'44px',textAlign:'center',boxShadow:'8px 8px 0 #1A0800'}}>
              <div style={{fontSize:'4rem',marginBottom:'10px'}}>🏆</div>
              <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:'2.2rem',marginBottom:'8px',color:'#1A0800'}}>Level Complete!</h2>
              <div style={{display:'flex',justifyContent:'center',gap:'10px',marginBottom:'14px'}}>
                {[0,1,2].map(i=><span key={i} style={{fontSize:'2.4rem',opacity:gsRef.current.stars>i?1:0.25,filter:gsRef.current.stars>i?'none':'grayscale(1)'}}>⭐</span>)}
              </div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.5rem',background:'#1A0800',color:'#FFCD00',borderRadius:'14px',padding:'10px 28px',marginBottom:'24px',display:'inline-block'}}>{xpDisplay} XP Earned!</div>
              <div style={{display:'flex',gap:'14px',justifyContent:'center'}}>
                <button onClick={()=>{gsRef.current=initW3GS();particlesRef.current=[];setPhase('playing');setXpDisplay(0);setHpDisplay(3);setChoiceResult(null);setEncounter(null);setShowHint(true)}} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:'9999px',background:'#FFCD00',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>Play Again</button>
                <button onClick={onBack} style={{padding:'13px 28px',border:'3px solid #1A0800',borderRadius:'9999px',background:'white',fontFamily:"'Fredoka One',cursive",fontSize:'0.95rem',cursor:'pointer',boxShadow:'4px 4px 0 #1A0800'}}>← Back</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:'14px',marginTop:'14px',alignItems:'center'}}>
        {(['left','right'] as const).map(dir=>(
          <button key={dir} onPointerDown={()=>touchKey(dir,true)} onPointerUp={()=>touchKey(dir,false)} onPointerLeave={()=>touchKey(dir,false)}
            style={{width:58,height:58,border:'3px solid #FFCD00',borderRadius:'16px',background:'rgba(255,205,0,0.12)',color:'#FFCD00',fontSize:'1.5rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {dir==='left'?'◀':'▶'}</button>
        ))}
        <button onPointerDown={()=>touchKey('up',true)} onPointerUp={()=>touchKey('up',false)} onPointerLeave={()=>touchKey('up',false)}
          style={{width:58,height:58,border:'3px solid #5DC264',borderRadius:'9999px',background:'rgba(93,194,100,0.12)',color:'#5DC264',fontSize:'1.6rem',cursor:'pointer',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>↑</button>
      </div>
      <button onClick={onBack} style={{marginTop:'10px',background:'transparent',border:'none',color:'rgba(255,205,0,0.45)',fontFamily:"'Fredoka One',cursive",fontSize:'0.72rem',cursor:'pointer',letterSpacing:'0.12em'}}>← BACK</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD SELECT
// ═══════════════════════════════════════════════════════════════════════════════

function WorldSelect({ onSelect, onBack }: { onSelect:(w:'w1'|'w2'|'w3')=>void; onBack:()=>void }) {
  const [hov, setHov] = useState<'w1'|'w2'|'w3'|null>(null)

  const cards = [
    {
      id: 'w1' as const,
      title: 'Boss Rush Arena',
      emoji: '⚔️',
      desc: 'Face 3 financial villains back-to-back in arena combat. Classic boss rush mode.',
      tags: ['Classic','Arena','3 Bosses'],
      col: '#E63946', glow: 'rgba(230,57,70,0.4)',
      details: 'Landlord · Crypto Bro · Hacker',
    },
    {
      id: 'w2' as const,
      title: 'Boss Gauntlet',
      emoji: '🌍',
      desc: 'Explore a scrolling world through 3 dangerous zones. Collect items. Expose fakes. Survive.',
      tags: ['NEW','Scrolling World','Item System','Clone Mechanic'],
      col: '#00EEFF', glow: 'rgba(0,238,255,0.4)',
      details: 'Inflation Titan · Debt Spiral · Bubble Baron',
    },
    {
      id: 'w3' as const,
      title: 'City Walk',
      emoji: '🏙️',
      desc: 'Stroll through a parallax city, meet NPCs, and answer financial knowledge quizzes to progress.',
      tags: ['Original','Parallax','NPC Encounters','Quiz'],
      col: '#A8FF78', glow: 'rgba(168,255,120,0.4)',
      details: 'Interactive City · Knowledge Challenges',
    },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#080510',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',fontFamily:"'Fredoka Variable',sans-serif"}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'0.75rem',letterSpacing:'0.3em',color:'#FFCD00',marginBottom:10,opacity:0.8}}>EPISODE MINIGAME</div>
        <h1 style={{fontFamily:"'Fredoka One',cursive",fontSize:'3rem',color:'white',textShadow:'4px 4px 0 #1A0800',margin:0,lineHeight:1.1}}>Choose Your World</h1>
        <p style={{color:'rgba(255,255,255,0.5)',marginTop:10,fontSize:'0.9rem'}}>Each world tests your financial knowledge in a different way</p>
      </div>

      <div style={{display:'flex',gap:24,flexWrap:'wrap',justifyContent:'center',maxWidth:780}}>
        {cards.map(card=>(
          <div key={card.id}
            onClick={()=>onSelect(card.id)}
            onMouseEnter={()=>setHov(card.id)}
            onMouseLeave={()=>setHov(null)}
            style={{
              width:340,cursor:'pointer',
              border:`3px solid ${hov===card.id?card.col:'rgba(255,255,255,0.12)'}`,
              borderRadius:20,
              background:hov===card.id?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)',
              boxShadow:hov===card.id?`0 0 40px ${card.glow},8px 8px 0 #1A0800`:'8px 8px 0 #1A0800',
              padding:'32px 28px',
              transition:'all 0.2s',
              transform:hov===card.id?'translate(-4px,-4px)':'none',
            }}>
            <div style={{fontSize:'3.2rem',marginBottom:14}}>{card.emoji}</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <span style={{fontFamily:"'Fredoka One',cursive",fontSize:'1.5rem',color:'white'}}>{card.title}</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {card.tags.map(tag=>(
                <span key={tag} style={{background:tag==='NEW'?card.col:'rgba(255,255,255,0.12)',color:tag==='NEW'?'#1A0800':'rgba(255,255,255,0.7)',fontFamily:"'Fredoka One',cursive",fontSize:'0.6rem',letterSpacing:'0.1em',padding:'2px 10px',borderRadius:9999,border:tag==='NEW'?'none':'1px solid rgba(255,255,255,0.15)',fontWeight:tag==='NEW'?700:400}}>{tag}</span>
              ))}
            </div>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'0.88rem',lineHeight:1.5,marginBottom:14}}>{card.desc}</p>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:'0.7rem',color:card.col,opacity:0.85,letterSpacing:'0.05em'}}>{card.details}</div>
            <div style={{marginTop:20,display:'flex',justifyContent:'flex-end'}}>
              <span style={{fontFamily:"'Fredoka One',cursive",fontSize:'0.85rem',color:hov===card.id?card.col:'rgba(255,255,255,0.4)',letterSpacing:'0.05em',transition:'color 0.2s'}}>
                {hov===card.id?'PLAY NOW →':'CLICK TO PLAY →'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onBack} style={{marginTop:36,background:'transparent',border:'2px solid rgba(255,255,255,0.15)',borderRadius:9999,color:'rgba(255,255,255,0.4)',fontFamily:"'Fredoka One',cursive",fontSize:'0.8rem',cursor:'pointer',letterSpacing:'0.1em',padding:'8px 24px',transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.4)';e.currentTarget.style.color='rgba(255,255,255,0.7)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.15)';e.currentTarget.style.color='rgba(255,255,255,0.4)'}}>
        ← Back to Hub
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function EpisodeNew() {
  const navigate = useNavigate()
  const [world, setWorld] = useState<null|'w1'|'w2'|'w3'>(null)
  if (world === 'w1') return <BossRush onBack={()=>setWorld(null)} />
  if (world === 'w2') return <BossGauntlet onBack={()=>setWorld(null)} />
  if (world === 'w3') return <CitySidescroller onBack={()=>setWorld(null)} />
  return <WorldSelect onSelect={setWorld} onBack={()=>navigate('/')} />
}
