#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_KEY = process.env.ELEVENLABS_API_KEY
const OUT_DIR = path.join(__dirname, '../public/sounds')

const SOUNDS = [
  { name: 'click',       text: 'Soft crisp UI button click tap sound, minimal, short',                                         duration: 0.5 },
  { name: 'correct',     text: 'Cheerful bright correct answer chime, happy positive ping ding',                               duration: 1.0 },
  { name: 'wrong',       text: 'Short wrong answer buzz, low negative tone, game show fail sound',                             duration: 0.8 },
  { name: 'xp-gain',    text: 'Magical coin collection sparkle reward, satisfying XP points earned sound',                    duration: 1.0 },
  { name: 'badge',       text: 'Achievement unlocked triumphant fanfare, short victory jingle, level up celebration',          duration: 2.0 },
  { name: 'swipe-yes',   text: 'Card swipe right whoosh, positive confirmation swoosh',                                        duration: 0.5 },
  { name: 'swipe-no',    text: 'Card swipe left reject dismiss whoosh sound',                                                  duration: 0.5 },
  { name: 'complete',    text: 'Game complete victory celebration jingle, cheerful triumphant finish, winner sound',            duration: 2.5 },
  { name: 'modal-open',  text: 'Soft pop open sound, subtle modal dialog appears, light spring pop',                           duration: 0.5 },
  { name: 'streak',      text: 'Fire power streak whoosh, energy charge up sound, exciting combo',                             duration: 0.8 },
]

async function generateSound(sound) {
  console.log(`Generating ${sound.name}...`)
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: sound.text,
      duration_seconds: sound.duration,
      prompt_influence: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${sound.name}: HTTP ${res.status} — ${err}`)
  }

  const buffer = await res.arrayBuffer()
  const outPath = path.join(OUT_DIR, `${sound.name}.mp3`)
  fs.writeFileSync(outPath, Buffer.from(buffer))
  console.log(`  ✓ ${sound.name}.mp3  (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
}

async function main() {
  if (!API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY not set')
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const sound of SOUNDS) {
    await generateSound(sound)
    await new Promise(r => setTimeout(r, 300))
  }
  console.log(`\nAll ${SOUNDS.length} sounds generated → public/sounds/`)
}

main().catch(e => { console.error(e); process.exit(1) })
