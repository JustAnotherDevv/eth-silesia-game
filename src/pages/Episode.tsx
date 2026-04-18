import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EPISODES, CHARS, type CharId, type Mood, type Scene, type Choice, type Episode } from '../data/episodes'
import { getSession } from '../lib/session'
import { submitGame } from '../lib/api'

// ── SVG Characters ────────────────────────────────────────────────────────────

function FrogHead({ mood = 'neutral', size = 140 }: { mood?: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
      {/* Neck */}
      <rect x="42" y="88" width="16" height="14" rx="4" fill="#5DC264" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Bow tie */}
      <polygon points="35,104 50,96 65,104 50,112" fill="#E63946" stroke="#1A0800" strokeWidth="2"/>
      <circle cx="50" cy="104" r="4" fill="#C62828" stroke="#1A0800" strokeWidth="1.5"/>
      {/* Head */}
      <ellipse cx="50" cy="56" rx="37" ry="35" fill="#5DC264" stroke="#1A0800" strokeWidth="3"/>
      {/* Eye stalks */}
      <ellipse cx="33" cy="28" rx="14" ry="14" fill="#5DC264" stroke="#1A0800" strokeWidth="2.5"/>
      <ellipse cx="67" cy="28" rx="14" ry="14" fill="#5DC264" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Whites */}
      <ellipse cx="33" cy="28" rx="10" ry="10" fill="white"/>
      <ellipse cx="67" cy="28" rx="10" ry="10" fill="white"/>
      {/* Pupils */}
      {mood === 'shocked' ? (
        <>
          <circle cx="33" cy="26" r="6" fill="#1A0800"/>
          <circle cx="67" cy="26" r="6" fill="#1A0800"/>
          <circle cx="35" cy="24" r="2" fill="white"/>
          <circle cx="69" cy="24" r="2" fill="white"/>
        </>
      ) : mood === 'angry' ? (
        <>
          <circle cx="35" cy="30" r="5" fill="#1A0800"/>
          <circle cx="69" cy="30" r="5" fill="#1A0800"/>
          <circle cx="37" cy="28" r="1.5" fill="white"/>
          <circle cx="71" cy="28" r="1.5" fill="white"/>
          <line x1="24" y1="20" x2="42" y2="27" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="76" y1="20" x2="58" y2="27" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <circle cx="34" cy="29" r="5.5" fill="#1A0800"/>
          <circle cx="68" cy="29" r="5.5" fill="#1A0800"/>
          <circle cx="36" cy="27" r="2" fill="white"/>
          <circle cx="70" cy="27" r="2" fill="white"/>
        </>
      )}
      {/* Mouth */}
      {mood === 'happy' && <>
        <path d="M 28 68 Q 50 86 72 68" fill="#E91E63" stroke="#1A0800" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M 28 68 Q 50 76 72 68" fill="white" stroke="none"/>
        <ellipse cx="27" cy="64" rx="9" ry="5" fill="#FF8A80" opacity="0.55"/>
        <ellipse cx="73" cy="64" rx="9" ry="5" fill="#FF8A80" opacity="0.55"/>
      </>}
      {mood === 'neutral' && <path d="M 33 68 Q 50 76 67 68" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood === 'worried' && <>
        <path d="M 33 72 Q 50 66 67 72" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M 68 35 Q 72 45 68 52 Q 65 45 68 35" fill="#7DD3FC" stroke="#1A0800" strokeWidth="1.5"/>
      </>}
      {mood === 'shocked' && <ellipse cx="50" cy="72" rx="9" ry="11" fill="#1A0800"/>}
      {mood === 'angry' && <path d="M 33 70 Q 50 62 67 70" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
    </svg>
  )
}

function CatHead({ mood = 'neutral', size = 140 }: { mood?: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
      {/* Neck */}
      <rect x="42" y="90" width="16" height="14" rx="4" fill="#FF8C42" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Collar */}
      <rect x="32" y="100" width="36" height="8" rx="4" fill="#1565C0" stroke="#1A0800" strokeWidth="2"/>
      {/* Head */}
      <ellipse cx="50" cy="60" rx="36" ry="34" fill="#FF8C42" stroke="#1A0800" strokeWidth="3"/>
      {/* Ears */}
      <polygon points="20,32 30,10 44,30" fill="#FF8C42" stroke="#1A0800" strokeWidth="2.5"/>
      <polygon points="80,32 70,10 56,30" fill="#FF8C42" stroke="#1A0800" strokeWidth="2.5"/>
      <polygon points="23,30 31,15 41,29" fill="#FFBF8C" stroke="none"/>
      <polygon points="77,30 69,15 59,29" fill="#FFBF8C" stroke="none"/>
      {/* Glasses */}
      <circle cx="35" cy="56" r="13" fill="none" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="65" cy="56" r="13" fill="none" stroke="#1A0800" strokeWidth="2.5"/>
      <line x1="48" y1="56" x2="52" y2="56" stroke="#1A0800" strokeWidth="2"/>
      <line x1="22" y1="52" x2="14" y2="50" stroke="#1A0800" strokeWidth="2"/>
      <line x1="78" y1="52" x2="86" y2="50" stroke="#1A0800" strokeWidth="2"/>
      {/* Eyes through glasses */}
      {mood === 'happy' ? (
        <>
          <path d="M 27 56 Q 35 48 43 56" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 57 56 Q 65 48 73 56" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      ) : mood === 'shocked' ? (
        <>
          <circle cx="35" cy="56" r="8" fill="white"/>
          <circle cx="65" cy="56" r="8" fill="white"/>
          <circle cx="35" cy="56" r="5" fill="#1A0800"/>
          <circle cx="65" cy="56" r="5" fill="#1A0800"/>
          <circle cx="37" cy="54" r="2" fill="white"/>
          <circle cx="67" cy="54" r="2" fill="white"/>
        </>
      ) : (
        <>
          <circle cx="35" cy="57" r="5" fill="#1A0800"/>
          <circle cx="65" cy="57" r="5" fill="#1A0800"/>
          <circle cx="37" cy="55" r="2" fill="white"/>
          <circle cx="67" cy="55" r="2" fill="white"/>
        </>
      )}
      {/* Nose + whiskers */}
      <ellipse cx="50" cy="67" rx="3" ry="2.5" fill="#FF6B9D" stroke="#1A0800" strokeWidth="1.5"/>
      <line x1="30" y1="66" x2="47" y2="68" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="70" y1="66" x2="53" y2="68" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="70" x2="46" y2="70" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="71" y1="70" x2="54" y2="70" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Mouth */}
      {mood === 'happy' && <>
        <path d="M 38 75 Q 50 85 62 75" fill="#FF6B9D" stroke="#1A0800" strokeWidth="2"/>
        <ellipse cx="30" cy="70" rx="8" ry="5" fill="#FF8A80" opacity="0.5"/>
        <ellipse cx="70" cy="70" rx="8" ry="5" fill="#FF8A80" opacity="0.5"/>
      </>}
      {mood === 'neutral' && <path d="M 40 75 Q 50 80 60 75" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {mood === 'worried' && <path d="M 40 78 Q 50 73 60 78" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {mood === 'shocked' && <ellipse cx="50" cy="78" rx="8" ry="9" fill="#1A0800"/>}
      {mood === 'angry' && <>
        <path d="M 40 76 Q 50 70 60 76" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        <line x1="27" y1="46" x2="43" y2="54" stroke="#1A0800" strokeWidth="2.5"/>
        <line x1="73" y1="46" x2="57" y2="54" stroke="#1A0800" strokeWidth="2.5"/>
      </>}
    </svg>
  )
}

function DogHead({ mood = 'neutral', size = 140 }: { mood?: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 115" fill="none">
      {/* Neck */}
      <rect x="42" y="92" width="16" height="14" rx="4" fill="#C8956C" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Head */}
      <ellipse cx="50" cy="60" rx="36" ry="34" fill="#C8956C" stroke="#1A0800" strokeWidth="3"/>
      {/* Fedora brim */}
      <ellipse cx="50" cy="28" rx="44" ry="8" fill="#5C3A1E" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Fedora crown */}
      <rect x="22" y="8" width="56" height="22" rx="10" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Hat band */}
      <rect x="22" y="24" width="56" height="7" rx="3" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>
      {/* Floppy ears */}
      <ellipse cx="16" cy="56" rx="12" ry="22" fill="#B07D52" stroke="#1A0800" strokeWidth="2.5" transform="rotate(-12 16 56)"/>
      <ellipse cx="84" cy="56" rx="12" ry="22" fill="#B07D52" stroke="#1A0800" strokeWidth="2.5" transform="rotate(12 84 56)"/>
      {/* Eyes */}
      {mood === 'happy' ? (
        <>
          <path d="M 29 52 Q 37 44 45 52" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 55 52 Q 63 44 71 52" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <ellipse cx="28" cy="58" rx="8" ry="5" fill="#FFB6A3" opacity="0.5"/>
          <ellipse cx="72" cy="58" rx="8" ry="5" fill="#FFB6A3" opacity="0.5"/>
        </>
      ) : mood === 'shocked' ? (
        <>
          <ellipse cx="37" cy="52" rx="10" ry="10" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx="63" cy="52" rx="10" ry="10" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <circle cx="37" cy="52" r="6" fill="#1A0800"/>
          <circle cx="63" cy="52" r="6" fill="#1A0800"/>
          <circle cx="40" cy="49" r="2" fill="white"/>
          <circle cx="66" cy="49" r="2" fill="white"/>
        </>
      ) : (
        <>
          <ellipse cx="37" cy="52" rx="8" ry="8" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx="63" cy="52" rx="8" ry="8" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <circle cx={mood === 'angry' ? 39 : 38} cy={mood === 'angry' ? 54 : 53} r="5" fill="#1A0800"/>
          <circle cx={mood === 'angry' ? 65 : 64} cy={mood === 'angry' ? 54 : 53} r="5" fill="#1A0800"/>
          <circle cx="40" cy="51" r="2" fill="white"/>
          <circle cx="66" cy="51" r="2" fill="white"/>
          {mood === 'angry' && <>
            <line x1="27" y1="43" x2="45" y2="50" stroke="#1A0800" strokeWidth="2.5"/>
            <line x1="73" y1="43" x2="55" y2="50" stroke="#1A0800" strokeWidth="2.5"/>
          </>}
          {mood === 'worried' && <path d="M 70 38 Q 74 48 70 55 Q 67 48 70 38" fill="#7DD3FC" stroke="#1A0800" strokeWidth="1.5"/>}
        </>
      )}
      {/* Snout */}
      <ellipse cx="50" cy="72" rx="16" ry="12" fill="#E8B89A" stroke="#1A0800" strokeWidth="2"/>
      {/* Nose */}
      <ellipse cx="50" cy="66" rx="7" ry="5" fill="#1A0800"/>
      {/* Gold tooth */}
      {mood !== 'shocked' && <rect x="47" y="78" width="7" height="6" rx="1" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>}
      {/* Mouth */}
      {mood === 'happy' && <path d="M 36 76 Q 50 86 64 76" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood === 'neutral' && <path d="M 38 77 Q 50 82 62 77" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {mood === 'worried' && <path d="M 38 80 Q 50 75 62 80" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {mood === 'shocked' && <ellipse cx="50" cy="80" rx="10" ry="12" fill="#1A0800"/>}
      {mood === 'angry' && <path d="M 36 78 Q 50 72 64 78" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
    </svg>
  )
}

function LandlordHead({ mood = 'neutral', size = 140 }: { mood?: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 115" fill="none">
      {/* Suspenders */}
      <line x1="36" y1="100" x2="46" y2="110" stroke="#5C3A1E" strokeWidth="4" strokeLinecap="round"/>
      <line x1="64" y1="100" x2="54" y2="110" stroke="#5C3A1E" strokeWidth="4" strokeLinecap="round"/>
      {/* Body hint */}
      <ellipse cx="50" cy="105" rx="22" ry="10" fill="#F8C8C0" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Big fat head */}
      <ellipse cx="50" cy="58" rx="40" ry="42" fill="#F8C8C0" stroke="#1A0800" strokeWidth="3"/>
      {/* Jowls */}
      <ellipse cx="20" cy="78" rx="14" ry="12" fill="#F0B8B0" stroke="#1A0800" strokeWidth="2"/>
      <ellipse cx="80" cy="78" rx="14" ry="12" fill="#F0B8B0" stroke="#1A0800" strokeWidth="2"/>
      {/* Eyes — dollar sign pupils */}
      <ellipse cx="35" cy="50" rx="11" ry="11" fill="white" stroke="#1A0800" strokeWidth="2"/>
      <ellipse cx="65" cy="50" rx="11" ry="11" fill="white" stroke="#1A0800" strokeWidth="2"/>
      {mood === 'happy' || mood === 'neutral' ? (
        <>
          <text x="30" y="55" fontSize="12" fill="#2D9A4E" fontWeight="bold">$</text>
          <text x="60" y="55" fontSize="12" fill="#2D9A4E" fontWeight="bold">$</text>
        </>
      ) : (
        <>
          <circle cx="35" cy="51" r="7" fill="#1A0800"/>
          <circle cx="65" cy="51" r="7" fill="#1A0800"/>
          <circle cx="37" cy="49" r="2" fill="white"/>
          <circle cx="67" cy="49" r="2" fill="white"/>
        </>
      )}
      {/* Pig snout */}
      <ellipse cx="50" cy="72" rx="18" ry="14" fill="#F0A0A0" stroke="#1A0800" strokeWidth="2.5"/>
      <ellipse cx="44" cy="72" rx="5" ry="4" fill="#D97B7B" stroke="#1A0800" strokeWidth="1.5"/>
      <ellipse cx="56" cy="72" rx="5" ry="4" fill="#D97B7B" stroke="#1A0800" strokeWidth="1.5"/>
      {/* Mouth */}
      {mood === 'happy' && <path d="M 33 83 Q 50 95 67 83" fill="#C06060" stroke="#1A0800" strokeWidth="2.5" strokeLinejoin="round"/>}
      {mood === 'neutral' && <path d="M 36 84 Q 50 90 64 84" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood === 'angry' && <path d="M 36 86 Q 50 80 64 86" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood === 'shocked' && <ellipse cx="50" cy="87" rx="10" ry="10" fill="#1A0800"/>}
      {mood === 'worried' && <path d="M 36 87 Q 50 82 64 87" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {/* Little ears */}
      <polygon points="18,30 26,12 38,28" fill="#F8C8C0" stroke="#1A0800" strokeWidth="2.5"/>
      <polygon points="82,30 74,12 62,28" fill="#F8C8C0" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Tiny hat */}
      <ellipse cx="50" cy="18" rx="30" ry="6" fill="#5C3A1E" stroke="#1A0800" strokeWidth="2"/>
      <rect x="30" y="6" width="40" height="14" rx="5" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2"/>
    </svg>
  )
}

function BankerHead({ mood = 'neutral', size = 140 }: { mood?: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 115" fill="none">
      {/* Body */}
      <rect x="28" y="96" width="44" height="16" rx="6" fill="#1565C0" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Tie */}
      <polygon points="47,96 50,88 53,96 50,110" fill="#E63946" stroke="#1A0800" strokeWidth="1.5"/>
      {/* Head */}
      <ellipse cx="50" cy="58" rx="34" ry="36" fill="#FFE4C8" stroke="#1A0800" strokeWidth="3"/>
      {/* Bank cap */}
      <ellipse cx="50" cy="24" rx="38" ry="7" fill="#1565C0" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="18" y="10" width="64" height="16" rx="8" fill="#1565C0" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="28" y="20" width="44" height="5" rx="2" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>
      {/* Eyes */}
      {mood === 'happy' ? (
        <>
          <path d="M 28 52 Q 37 44 46 52" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 54 52 Q 63 44 72 52" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <ellipse cx="27" cy="57" rx="8" ry="5" fill="#FFB6A3" opacity="0.5"/>
          <ellipse cx="73" cy="57" rx="8" ry="5" fill="#FFB6A3" opacity="0.5"/>
        </>
      ) : (
        <>
          <ellipse cx="37" cy="52" rx="9" ry="9" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx="63" cy="52" rx="9" ry="9" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <circle cx="38" cy="53" r="5" fill="#1A0800"/>
          <circle cx="64" cy="53" r="5" fill="#1A0800"/>
          <circle cx="40" cy="51" r="2" fill="white"/>
          <circle cx="66" cy="51" r="2" fill="white"/>
        </>
      )}
      {/* Buck teeth */}
      <rect x="44" y="73" width="6" height="8" rx="2" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
      <rect x="50" y="73" width="6" height="8" rx="2" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
      {/* Mouth */}
      {mood === 'happy' && <path d="M 33 72 Q 50 84 67 72" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood !== 'happy' && <path d="M 35 72 Q 50 78 65 72" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {mood === 'shocked' && <ellipse cx="50" cy="76" rx="9" ry="10" fill="#1A0800"/>}
    </svg>
  )
}

function FriendHead({ mood = 'neutral', size = 140 }: { mood?: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 115" fill="none">
      {/* Laptop bag strap */}
      <line x1="30" y1="100" x2="50" y2="110" stroke="#8B5E3C" strokeWidth="4" strokeLinecap="round"/>
      {/* Head */}
      <ellipse cx="50" cy="58" rx="36" ry="36" fill="#FFDAB0" stroke="#1A0800" strokeWidth="3"/>
      {/* Messy hair */}
      <path d="M 20 40 Q 30 10 50 15 Q 70 10 80 40" fill="#5C3A1E" stroke="#1A0800" strokeWidth="2"/>
      <path d="M 20 40 Q 16 28 22 22" fill="#5C3A1E" stroke="none"/>
      <path d="M 80 40 Q 84 28 78 22" fill="#5C3A1E" stroke="none"/>
      {/* Eyes */}
      {mood === 'happy' ? (
        <>
          <path d="M 28 50 Q 37 42 46 50" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 54 50 Q 63 42 72 50" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      ) : mood === 'shocked' ? (
        <>
          <ellipse cx="37" cy="52" rx="10" ry="10" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx="63" cy="52" rx="10" ry="10" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <circle cx="37" cy="52" r="7" fill="#1A0800"/>
          <circle cx="63" cy="52" r="7" fill="#1A0800"/>
          <circle cx="40" cy="49" r="2.5" fill="white"/>
          <circle cx="66" cy="49" r="2.5" fill="white"/>
        </>
      ) : (
        <>
          <ellipse cx="37" cy="52" rx="8" ry="8" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx="63" cy="52" rx="8" ry="8" fill="white" stroke="#1A0800" strokeWidth="2"/>
          <circle cx="38" cy="53" r="5" fill="#1A0800"/>
          <circle cx="64" cy="53" r="5" fill="#1A0800"/>
          <circle cx="40" cy="51" r="2" fill="white"/>
          <circle cx="66" cy="51" r="2" fill="white"/>
        </>
      )}
      {/* Smirk */}
      {mood === 'happy' && <>
        <path d="M 36 68 Q 50 80 64 68" fill="#D4756B" stroke="#1A0800" strokeWidth="2.5" strokeLinejoin="round"/>
        <ellipse cx="30" cy="64" rx="8" ry="5" fill="#FFB6A3" opacity="0.5"/>
        <ellipse cx="70" cy="64" rx="8" ry="5" fill="#FFB6A3" opacity="0.5"/>
      </>}
      {mood === 'neutral' && <path d="M 38 68 Q 52 73 64 66" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood === 'worried' && <path d="M 38 71 Q 50 66 62 71" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>}
      {mood === 'shocked' && <ellipse cx="50" cy="72" rx="9" ry="11" fill="#1A0800"/>}
      {mood === 'angry' && <path d="M 38 69 Q 50 63 62 69" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* Sweat drops for worried */}
      {mood === 'worried' && <path d="M 72 40 Q 76 50 72 57 Q 68 50 72 40" fill="#7DD3FC" stroke="#1A0800" strokeWidth="1.5"/>}
      {/* Energy drink can */}
      {mood === 'happy' && <>
        <rect x="74" y="75" width="12" height="20" rx="3" fill="#E63946" stroke="#1A0800" strokeWidth="1.5"/>
        <text x="76" y="89" fontSize="8" fill="white" fontWeight="bold">⚡</text>
      </>}
    </svg>
  )
}

// ── Character Head router
function CharHead({ charId, mood, size }: { charId: CharId | string; mood: Mood; size?: number }) {
  if (charId === 'frog')     return <FrogHead    mood={mood} size={size}/>
  if (charId === 'cat')      return <CatHead     mood={mood} size={size}/>
  if (charId === 'dog')      return <DogHead     mood={mood} size={size}/>
  if (charId === 'landlord') return <LandlordHead mood={mood} size={size}/>
  if (charId === 'banker')   return <BankerHead  mood={mood} size={size}/>
  if (charId === 'friend')   return <FriendHead  mood={mood} size={size}/>
  return <FrogHead mood={mood} size={size}/>
}

// ── Scene Backgrounds ────────────────────────────────────────────────────────

function ApartmentBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{background:'linear-gradient(180deg,#C8A96E 0%,#B8956A 100%)',borderTop:'4px solid #1A0800'}}/>
      {/* Wall */}
      <div className="absolute inset-0 bottom-32" style={{background:'repeating-linear-gradient(90deg,#FEF3C7 0px,#FEF3C7 58px,#F5E6B2 58px,#F5E6B2 60px)'}}>
        {/* Wallpaper pattern */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle,#8B5E3C 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>
      </div>
      {/* Window */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-56 h-44 rounded-t-full" style={{background:'linear-gradient(180deg,#87CEEB 0%,#B0E2FF 100%)',border:'5px solid #1A0800',boxShadow:'inset 0 0 0 4px #FEF3C7'}}>
        {/* City skyline */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-2">
          {[24,36,20,44,28,18,38,22].map((h,i) => (
            <div key={i} style={{width:14,height:h,background:['#1565C0','#5C3A1E','#7B2D8B','#1565C0','#2D9A4E','#1565C0','#5C3A1E','#1565C0'][i],borderTopLeftRadius:2,borderTopRightRadius:2,flexShrink:0,border:'2px solid #1A0800'}}/>
          ))}
        </div>
        {/* Window divider */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" style={{borderRight:'4px solid #1A0800'}}/>
          <div className="flex-1"/>
        </div>
        <div className="absolute left-0 right-0 top-1/2" style={{height:4,background:'#1A0800'}}/>
      </div>
      {/* Door */}
      <div className="absolute bottom-32 right-16 w-24 h-40 rounded-t-full" style={{background:'#8B5E3C',border:'4px solid #1A0800'}}>
        <div className="absolute inset-3 rounded-t-full" style={{border:'2px solid #5C3A1E'}}/>
        <div className="absolute right-3 top-1/2 w-3 h-3 rounded-full" style={{background:'#FFCD00',border:'2px solid #1A0800'}}/>
      </div>
      {/* Rug */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-64 h-16 rounded-full" style={{background:'radial-gradient(ellipse,#E63946 0%,#C62828 60%,#8B0000 100%)',border:'4px solid #1A0800'}}>
        <div className="absolute inset-4 rounded-full" style={{border:'3px dotted rgba(255,255,255,0.3)'}}/>
      </div>
    </div>
  )
}

function BankBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-28" style={{background:'repeating-linear-gradient(90deg,#E8D5A3 0px,#E8D5A3 38px,#D4C088 38px,#D4C088 40px)',borderTop:'4px solid #1A0800'}}/>
      {/* Marble wall */}
      <div className="absolute inset-0 bottom-28" style={{background:'linear-gradient(180deg,#EEE8D0 0%,#E8E0C8 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,#C8B89A 0px,transparent 2px,transparent 20px,#C8B89A 20px)' }}/>
      </div>
      {/* Columns */}
      {[10, 30, 60, 80].map(left => (
        <div key={left} className="absolute bottom-28 w-10 bg-[#F5EDD8]" style={{left:`${left}%`,height:'60%',border:'3px solid #1A0800',borderRadius:'6px 6px 0 0'}}>
          <div className="absolute top-0 left-0 right-0 h-10 bg-[#E8D5A3]" style={{border:'3px solid #1A0800',borderRadius:'6px 6px 0 0',transform:'translateY(-8px) scaleX(1.3)'}}/>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#E8D5A3]" style={{border:'3px solid #1A0800',borderRadius:4}}/>
        </div>
      ))}
      {/* Vault */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-40 h-48 rounded-full" style={{background:'radial-gradient(circle,#8B8B8B 0%,#6B6B6B 100%)',border:'6px solid #1A0800',boxShadow:'inset 0 0 20px rgba(0,0,0,0.4)'}}>
        {[0,60,120,180,240,300].map(angle => (
          <div key={angle} className="absolute top-1/2 left-1/2 w-1 h-14" style={{background:'#1A0800',transformOrigin:'0 0',transform:`rotate(${angle}deg)`,borderRadius:2}}/>
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full" style={{background:'#FFCD00',border:'4px solid #1A0800'}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{background:'#5C3A1E',border:'3px solid #1A0800'}}/>
      </div>
      {/* Sign */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 px-8 py-3 rounded-lg" style={{background:'#FFCD00',border:'4px solid #1A0800',boxShadow:'4px 4px 0 #1A0800'}}>
        <span className="font-heading text-xl text-[#1A0800]">🏦 PKO BANK</span>
      </div>
    </div>
  )
}

function StreetBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0 bottom-1/3" style={{background:'linear-gradient(180deg,#87CEEB 0%,#B8E0FF 100%)'}}/>
      {/* Sidewalk */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{background:'repeating-linear-gradient(90deg,#C8C0B8 0px,#C8C0B8 38px,#B8B0A8 38px,#B8B0A8 40px)',borderTop:'4px solid #1A0800'}}/>
      {/* Buildings */}
      {[
        {left:2,w:18,h:55,color:'#7B2D8B'},{left:18,w:14,h:40,color:'#1565C0'},
        {left:30,w:20,h:65,color:'#5C3A1E'},{left:50,w:16,h:48,color:'#E63946'},
        {left:65,w:22,h:58,color:'#2D9A4E'},{left:85,w:14,h:44,color:'#1565C0'},
      ].map((b,i) => (
        <div key={i} className="absolute bottom-1/3" style={{left:`${b.left}%`,width:`${b.w}%`,height:`${b.h}%`,background:b.color,border:'3px solid #1A0800',borderBottom:'none'}}>
          {/* Windows */}
          <div className="absolute inset-2 grid grid-cols-2 gap-1 content-start">
            {[...Array(6)].map((_,wi) => (
              <div key={wi} className="h-4" style={{background:'#FFCD00',border:'2px solid #1A0800',borderRadius:2,opacity:Math.random()>0.3?1:0.3}}/>
            ))}
          </div>
        </div>
      ))}
      {/* Lamppost */}
      <div className="absolute bottom-1/3 right-20 w-3 bg-[#5C3A1E]" style={{height:'45%',border:'2px solid #1A0800'}}>
        <div className="absolute -top-3 -left-6 w-12 h-6 rounded-t-full" style={{background:'#FFCD00',border:'2px solid #1A0800'}}/>
      </div>
    </div>
  )
}

function SceneBg({ bg }: { bg: string }) {
  if (bg === 'bank')   return <BankBg/>
  if (bg === 'street') return <StreetBg/>
  return <ApartmentBg/>
}

// ── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const iv = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(iv); setDone(true) }
    }, speed)
    return () => clearInterval(iv)
  }, [text, speed])

  const skip = useCallback(() => { setDisplayed(text); setDone(true) }, [text])
  return { displayed, done, skip }
}

// ── Stars component ──────────────────────────────────────────────────────────

function Stars({ count, total = 3, size = 32 }: { count: number; total?: number; size?: number }) {
  return (
    <div className="flex gap-2 justify-center">
      {[...Array(total)].map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            filter: i < count ? 'drop-shadow(0 0 6px #FFCD00)' : 'grayscale(1) opacity(0.3)',
            animation: i < count ? `pop 0.4s cubic-bezier(.36,1.56,.64,1) ${i * 0.15}s both` : 'none',
          }}
        >⭐</span>
      ))}
    </div>
  )
}

// ── Film reel intro ──────────────────────────────────────────────────────────

function FilmReelIntro({ onDone }: { onDone: () => void }) {
  const [frame, setFrame] = useState(3)

  useEffect(() => {
    const iv = setInterval(() => {
      setFrame(f => {
        if (f <= 1) { clearInterval(iv); setTimeout(onDone, 400); return 0 }
        return f - 1
      })
    }, 700)
    return () => clearInterval(iv)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'#1A0800'}}>
      {/* Film sprocket holes */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-around py-4">
        {[...Array(8)].map((_,i) => <div key={i} className="mx-auto w-6 h-5 rounded-sm bg-[#FEF9EE]" style={{border:'2px solid #5C3A1E'}}/>)}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col justify-around py-4">
        {[...Array(8)].map((_,i) => <div key={i} className="mx-auto w-6 h-5 rounded-sm bg-[#FEF9EE]" style={{border:'2px solid #5C3A1E'}}/>)}
      </div>
      {/* Frame */}
      {frame > 0 ? (
        <div
          key={frame}
          className="w-48 h-48 rounded-2xl flex items-center justify-center"
          style={{
            background:'#FFCD00',
            border:'6px solid #FEF9EE',
            boxShadow:'0 0 0 4px #1A0800, 0 0 40px rgba(255,205,0,0.4)',
            animation:'pop 0.2s ease-out',
          }}
        >
          <span className="font-heading text-[96px] leading-none text-[#1A0800]" style={{textShadow:'4px 4px 0 rgba(0,0,0,0.2)'}}>{frame}</span>
        </div>
      ) : (
        <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{background:'#FEF9EE',animation:'inflate 0.4s ease-out'}}>
          <span style={{fontSize:64}}>🎬</span>
        </div>
      )}
    </div>
  )
}

// ── Title card ───────────────────────────────────────────────────────────────

function TitleCard({ episode, onStart }: { episode: Episode; onStart: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 cursor-pointer"
      style={{background:'#1A0800'}}
      onClick={onStart}
    >
      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.8\'/%3E%3C/svg%3E")',backgroundSize:'200px 200px'}}/>
      <div className="text-center" style={{animation:'slam 0.6s cubic-bezier(.36,1.56,.64,1) both'}}>
        <div className="font-heading text-[#FFCD00] text-2xl mb-2" style={{letterSpacing:'0.4em',textShadow:'2px 2px 0 #5C3A1E'}}>
          EPISODE {episode.num}
        </div>
        <div
          className="font-heading text-[#FEF9EE] text-5xl md:text-6xl leading-tight px-8"
          style={{textShadow:'4px 4px 0 #E63946, 8px 8px 0 #5C3A1E', maxWidth:600}}
        >
          {episode.title}
        </div>
      </div>
      <div
        className="font-sans text-[#FEF3C7] text-xl text-center px-8 max-w-lg"
        style={{animation:'bounce-in 0.5s 0.4s both'}}
      >
        "{episode.tagline}"
      </div>
      <div className="mt-4 px-8 py-3 rounded-full font-heading text-xl text-[#1A0800]" style={{background:'#FFCD00',border:'4px solid #FEF9EE',animation:'bounce-in 0.5s 0.7s both',boxShadow:'4px 4px 0 #5C3A1E'}}>
        Click to Start ▶
      </div>
      <div className="absolute bottom-6 font-sans text-[#FEF3C7] opacity-50 text-sm">
        Theme: {episode.theme}
      </div>
    </div>
  )
}

// ── Character select ─────────────────────────────────────────────────────────

function CharSelect({ onSelect }: { onSelect: (c: CharId) => void }) {
  const [hovered, setHovered] = useState<CharId | null>(null)

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 px-4" style={{background:'linear-gradient(135deg,#1A0800 0%,#2D1200 50%,#1A0800 100%)'}}>
      <div style={{animation:'slam 0.5s cubic-bezier(.36,1.56,.64,1) both'}}>
        <h2 className="font-heading text-5xl text-[#FFCD00] text-center" style={{textShadow:'4px 4px 0 #5C3A1E'}}>
          CHOOSE YOUR CHARACTER
        </h2>
        <p className="font-sans text-[#FEF3C7] text-center text-lg mt-2 opacity-80">Who will face the financial gauntlet?</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl justify-center">
        {(Object.keys(CHARS) as CharId[]).map((charId, i) => {
          const char = CHARS[charId]
          const isHovered = hovered === charId
          return (
            <button
              key={charId}
              onMouseEnter={() => setHovered(charId)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(charId)}
              className="flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl cursor-pointer transition-all"
              style={{
                background: isHovered ? char.color : '#2D1A00',
                border: `4px solid ${isHovered ? '#FEF9EE' : '#5C3A1E'}`,
                boxShadow: isHovered ? `8px 8px 0 #1A0800, 0 0 30px ${char.color}88` : '4px 4px 0 #1A0800',
                transform: isHovered ? 'translateY(-8px) scale(1.04)' : 'none',
                animation: `bounce-in 0.5s ${0.2 + i * 0.15}s both`,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{animation: isHovered ? 'wobble 0.6s infinite' : 'float 3s ease-in-out infinite'}}>
                <CharHead charId={charId} mood={isHovered ? 'happy' : 'neutral'} size={130}/>
              </div>
              <div className="text-center">
                <div className="font-heading text-2xl" style={{color: isHovered ? '#1A0800' : '#FFCD00', textShadow: isHovered ? 'none' : '2px 2px 0 #5C3A1E'}}>
                  {char.name}
                </div>
                <div className="font-sans text-sm mt-1" style={{color: isHovered ? '#1A0800' : '#FEF3C7', opacity: 0.9}}>
                  {char.title}
                </div>
                <div className="font-sans text-xs mt-2 leading-snug" style={{color: isHovered ? '#1A0800' : '#E8D5A3', maxWidth:160, margin:'8px auto 0', opacity:0.8}}>
                  {char.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Scene view ───────────────────────────────────────────────────────────────

function SceneView({
  scene,
  playerChar,
  onChoice,
  onAdvance,
  chosenChoice,
}: {
  scene: Scene
  playerChar: CharId
  onChoice: (c: Choice) => void
  onAdvance: () => void
  chosenChoice: Choice | null
}) {
  const showOutcome = !!chosenChoice
  const text = showOutcome ? chosenChoice!.outcome : scene.dialogue
  const { displayed, done, skip } = useTypewriter(text, 22)
  const [showChoices, setShowChoices] = useState(false)

  // Show choices once typewriter is done
  useEffect(() => {
    setShowChoices(false)
    if (done && scene.choices && !showOutcome) {
      const t = setTimeout(() => setShowChoices(true), 200)
      return () => clearTimeout(t)
    }
  }, [done, scene.choices, showOutcome])

  // Auto-advance for narration scenes
  useEffect(() => {
    if (done && scene.autoNext && !scene.choices) {
      const t = setTimeout(onAdvance, 2200)
      return () => clearTimeout(t)
    }
  }, [done, scene.autoNext, scene.choices, onAdvance])

  // Auto-advance after outcome is shown
  useEffect(() => {
    if (showOutcome && done) {
      const t = setTimeout(onAdvance, 2500)
      return () => clearTimeout(t)
    }
  }, [showOutcome, done, onAdvance])

  const speakerIsNpc   = scene.speakerType !== 'player' && scene.speakerType !== 'narrator'
  const npcChar        = scene.npc ?? scene.speakerType
  const isNarrator     = scene.speakerType === 'narrator'

  return (
    <div className="fixed inset-0 z-30 flex flex-col" style={{fontFamily:"'Fredoka Variable', sans-serif"}}>
      {/* Background */}
      <div className="relative flex-1 overflow-hidden">
        <SceneBg bg={scene.bg}/>
        {/* Film grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.8\'/%3E%3C/svg%3E")',backgroundSize:'200px 200px'}}/>
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at center, transparent 50%, rgba(26,8,0,0.45) 100%)'}}/>

        {/* Characters stage */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-8 pb-4">
          {/* Player character (left) */}
          <div
            className="flex flex-col items-center gap-2"
            style={{
              animation: 'float 3s ease-in-out infinite',
              filter: speakerIsNpc ? 'brightness(0.65)' : 'none',
              transition: 'filter 0.3s',
            }}
          >
            <div style={{
              background: '#FEF9EE',
              border: '4px solid #1A0800',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              padding: 8,
              boxShadow: '6px 6px 0 #1A0800',
              animation: !speakerIsNpc ? 'bounce-in 0.4s ease-out' : 'none',
            }}>
              <CharHead charId={playerChar} mood={scene.playerMood} size={110}/>
            </div>
            <div className="font-heading text-sm text-[#FEF9EE] px-3 py-1 rounded-full" style={{background:'#1A0800',border:'2px solid #FFCD00', boxShadow:'2px 2px 0 #5C3A1E'}}>
              You
            </div>
          </div>

          {/* NPC (right) — skip for narrator */}
          {!isNarrator && (
            <div
              className="flex flex-col items-center gap-2"
              style={{
                animation: 'float 3s ease-in-out 1.5s infinite',
                filter: !speakerIsNpc ? 'brightness(0.65)' : 'none',
                transition: 'filter 0.3s',
                transform: 'scaleX(-1)',
              }}
            >
              <div style={{
                background: '#FEF9EE',
                border: '4px solid #1A0800',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                padding: 8,
                boxShadow: '6px 6px 0 #1A0800',
                animation: speakerIsNpc ? 'bounce-in 0.4s ease-out' : 'none',
              }}>
                <CharHead charId={npcChar} mood={scene.npcMood} size={110}/>
              </div>
              <div className="font-heading text-sm text-[#FEF9EE] px-3 py-1 rounded-full" style={{background:'#1A0800',border:'2px solid #FFCD00',boxShadow:'2px 2px 0 #5C3A1E',transform:'scaleX(-1)'}}>
                {scene.speakerName.split(' (')[0].split(' ')[0]}
              </div>
            </div>
          )}
          {isNarrator && (
            <div className="flex flex-col items-center gap-2" style={{animation:'float 3s ease-in-out 1.5s infinite'}}>
              <div style={{fontSize:80,filter:'drop-shadow(4px 4px 0 #1A0800)',animation:'wobble 4s ease-in-out infinite'}}>📽️</div>
              <div className="font-heading text-sm text-[#FEF9EE] px-3 py-1 rounded-full" style={{background:'#1A0800',border:'2px solid #FFCD00',boxShadow:'2px 2px 0 #5C3A1E'}}>Narrator</div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogue + choices panel */}
      <div style={{background:'#1A0800',borderTop:'4px solid #FFCD00',minHeight:showChoices?280:170}}>
        {/* Speaker label */}
        <div className="px-6 pt-3 pb-1">
          <span className="font-heading text-base px-4 py-1 rounded-full" style={{background:'#FFCD00',color:'#1A0800',border:'3px solid #FEF9EE',boxShadow:'2px 2px 0 #5C3A1E'}}>
            {showOutcome ? '💬 Outcome' : scene.speakerName}
          </span>
        </div>

        {/* Dialogue box */}
        <div
          className="mx-4 mt-1 mb-3 px-5 py-4 rounded-2xl cursor-pointer relative overflow-hidden"
          style={{background:'#FEF9EE',border:'3px solid #5C3A1E',boxShadow:'4px 4px 0 #5C3A1E',minHeight:72}}
          onClick={!done ? skip : (scene.choices || showOutcome ? undefined : onAdvance)}
        >
          <p className="font-sans text-[#1A0800] text-lg leading-snug">
            {displayed}
            {!done && <span style={{animation:'blink 0.8s step-end infinite',borderRight:'3px solid #1A0800',marginLeft:1}}>&nbsp;</span>}
          </p>
          {done && !scene.choices && !showOutcome && (
            <div className="absolute bottom-3 right-4 font-heading text-sm text-[#E63946] animate-pulse">tap to continue ▶</div>
          )}
        </div>

        {/* Fact strip */}
        {done && scene.fact && !showOutcome && (
          <div className="mx-4 mb-3 px-4 py-2 rounded-xl font-sans text-sm text-[#1A0800]" style={{background:'#FFCD00',border:'2px solid #5C3A1E',animation:'bounce-in 0.4s ease-out'}}>
            {scene.fact}
          </div>
        )}

        {/* Choices */}
        {showChoices && !showOutcome && (
          <div className="px-4 pb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {scene.choices!.map((choice, i) => (
              <button
                key={choice.id}
                onClick={() => onChoice(choice)}
                className="flex items-start gap-3 p-4 rounded-2xl text-left cursor-pointer group"
                style={{
                  background: '#2D1A00',
                  border: '3px solid #5C3A1E',
                  boxShadow: '4px 4px 0 #1A0800',
                  animation: `bounce-in 0.4s ${i * 0.1}s both`,
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.background='#3D2A10'; (e.currentTarget as HTMLElement).style.boxShadow='6px 8px 0 #1A0800'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.background='#2D1A00'; (e.currentTarget as HTMLElement).style.boxShadow='4px 4px 0 #1A0800'; }}
              >
                <span style={{fontSize:28,flexShrink:0,animation:'wobble 2s ease-in-out infinite'}}>{choice.emoji}</span>
                <div>
                  <div className="font-heading text-base text-[#FFCD00]" style={{textShadow:'1px 1px 0 #5C3A1E'}}>{choice.text}</div>
                  <div className="font-sans text-xs mt-1 text-[#E8D5A3] opacity-80">{choice.detail}</div>
                  <div className="flex gap-1 mt-2">
                    {[1,2,3].map(s => <span key={s} style={{fontSize:14,opacity:s<=choice.stars?1:0.2}}>⭐</span>)}
                    <span className="font-heading text-xs ml-1" style={{color:'#FFCD00'}}>+{choice.xp} XP</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Episode result ────────────────────────────────────────────────────────────

function EpisodeResult({
  episode,
  stars,
  xp,
  playerChar,
  onReplay,
  onHome,
}: {
  episode: Episode
  stars: number
  xp: number
  playerChar: CharId
  onReplay: () => void
  onHome: () => void
}) {
  const [showStars, setShowStars] = useState(false)
  const [showXp,    setShowXp]    = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowStars(true), 600)
    const t2 = setTimeout(() => setShowXp(true),    1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const msg = stars === 3 ? ['BRILLIANT!','💫 Perfect financial thinking!','#2D9A4E']
            : stars === 2 ? ['GOOD JOB!','📈 Solid instincts, keep growing!','#1565C0']
            :               ['LESSON LEARNED!','💪 Knowledge is your new XP!','#E63946']

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6" style={{background:'linear-gradient(135deg,#1A0800 0%,#2D1200 100%)'}}>
      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.8\'/%3E%3C/svg%3E")',backgroundSize:'200px 200px'}}/>

      {/* Confetti dots */}
      {stars === 3 && [...Array(20)].map((_,i) => (
        <div key={i} className="absolute w-3 h-3 rounded-full pointer-events-none" style={{
          background:['#FFCD00','#E63946','#2D9A4E','#1565C0','#7B2D8B'][i%5],
          left:`${5+i*4.5}%`, top:`${10+Math.sin(i)*40}%`,
          animation:`float ${2+i*0.2}s ease-in-out ${i*0.1}s infinite`,
          border:'2px solid #1A0800',
        }}/>
      ))}

      {/* Character */}
      <div style={{animation:'slam 0.6s cubic-bezier(.36,1.56,.64,1) both'}}>
        <div style={{background:'#FEF9EE',border:'6px solid #FFCD00',borderRadius:'50% 50% 50% 50%/60% 60% 40% 40%',padding:12,boxShadow:'8px 8px 0 #1A0800, 0 0 40px rgba(255,205,0,0.3)',animation:'wobble 1s ease-in-out 0.8s infinite'}}>
          <CharHead charId={playerChar} mood={stars>=2?'happy':'worried'} size={130}/>
        </div>
      </div>

      {/* Title */}
      <div className="text-center" style={{animation:'bounce-in 0.5s 0.3s both'}}>
        <div className="font-heading text-6xl" style={{color:msg[2] as string,textShadow:'4px 4px 0 #1A0800, 0 0 20px rgba(255,255,255,0.2)'}}>
          {msg[0]}
        </div>
        <div className="font-sans text-[#FEF3C7] text-xl mt-2">{msg[1]}</div>
        <div className="font-sans text-[#E8D5A3] text-sm mt-1 opacity-70">{episode.theme} mastered!</div>
      </div>

      {/* Stars */}
      {showStars && <Stars count={stars} size={40}/>}

      {/* XP pill */}
      {showXp && (
        <div
          className="px-8 py-3 rounded-full font-heading text-2xl text-[#1A0800]"
          style={{background:'#FFCD00',border:'4px solid #FEF9EE',boxShadow:'4px 4px 0 #5C3A1E',animation:'pop 0.4s cubic-bezier(.36,1.56,.64,1) both'}}
        >
          +{xp} XP earned ⚡
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-2" style={{animation:'bounce-in 0.5s 1.8s both'}}>
        <button
          onClick={onReplay}
          className="px-6 py-3 rounded-2xl font-heading text-lg cursor-pointer"
          style={{background:'#2D1A00',border:'4px solid #5C3A1E',color:'#FFCD00',boxShadow:'4px 4px 0 #1A0800',textShadow:'1px 1px 0 #5C3A1E'}}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.background='#3D2A10'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.background='#2D1A00'; }}
        >
          🔄 Replay
        </button>
        <button
          onClick={onHome}
          className="px-6 py-3 rounded-2xl font-heading text-lg cursor-pointer"
          style={{background:'#FFCD00',border:'4px solid #FEF9EE',color:'#1A0800',boxShadow:'4px 4px 0 #5C3A1E'}}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; }}
        >
          🏠 Home
        </button>
      </div>
    </div>
  )
}

// ── Main Episode page ─────────────────────────────────────────────────────────

type Phase = 'reel' | 'title' | 'chars' | 'scene' | 'result'

export default function EpisodePage() {
  const { id }   = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const episode = EPISODES.find(e => e.id === (id ?? 'ep1')) ?? EPISODES[0]

  const [phase,        setPhase]       = useState<Phase>('reel')
  const [playerChar,   setPlayerChar]  = useState<CharId>('frog')
  const [sceneId,      setSceneId]     = useState(episode.scenes[0].id)
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)
  const [finalStars,   setFinalStars]  = useState(0)
  const [finalXp,      setFinalXp]     = useState(0)

  // Persist character choice
  useEffect(() => {
    const saved = localStorage.getItem('episode_char') as CharId | null
    if (saved && saved in CHARS) setPlayerChar(saved)
  }, [])

  const currentScene = episode.scenes.find(s => s.id === sceneId) ?? episode.scenes[0]

  const handleChoice = useCallback((choice: Choice) => {
    setChosenChoice(choice)
    setFinalStars(choice.stars)
    setFinalXp(choice.xp)
  }, [])

  const handleAdvance = useCallback(() => {
    if (chosenChoice) {
      // Move to consequence scene
      const nextId = chosenChoice.next
      setChosenChoice(null)
      setSceneId(nextId)
      return
    }
    if (currentScene.autoNext) {
      setSceneId(currentScene.autoNext)
    } else if (currentScene.isEnding) {
      // Save XP to backend
      const session = getSession()
      if (session) {
        submitGame({
          userId: session.id,
          gameType: 'episode',
          xpEarned: finalXp,
          score: finalStars,
          total: 3,
          metadata: { episodeId: episode.id },
        }).catch(() => {/* non-critical */})
      }
      setPhase('result')
    }
  }, [chosenChoice, currentScene, finalXp, finalStars, episode.id])

  const handleReplay = useCallback(() => {
    setSceneId(episode.scenes[0].id)
    setChosenChoice(null)
    setFinalStars(0)
    setFinalXp(0)
    setPhase('title')
  }, [episode])

  const handleCharSelect = useCallback((c: CharId) => {
    setPlayerChar(c)
    localStorage.setItem('episode_char', c)
    setPhase('scene')
  }, [])

  return (
    <div style={{width:'100vw',height:'100vh',overflow:'hidden',background:'#1A0800',fontFamily:"'Fredoka Variable',sans-serif"}}>
      {phase === 'reel' && <FilmReelIntro onDone={() => setPhase('title')}/>}
      {phase === 'title' && <TitleCard episode={episode} onStart={() => setPhase('chars')}/>}
      {phase === 'chars' && <CharSelect onSelect={handleCharSelect}/>}
      {phase === 'scene' && (
        <SceneView
          scene={currentScene}
          playerChar={playerChar}
          onChoice={handleChoice}
          onAdvance={handleAdvance}
          chosenChoice={chosenChoice}
        />
      )}
      {phase === 'result' && (
        <EpisodeResult
          episode={episode}
          stars={finalStars}
          xp={finalXp}
          playerChar={playerChar}
          onReplay={handleReplay}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  )
}
