// content/weeks-adult.ts
//
// Week metadata for the ADULT (parent) program. Same R Factor spine as the kid
// program, framed for the grown-up: managing your OWN response when your kids
// act up. Full 13-week program. Colors/emojis mirror the kid program so the
// shared concept visuals stay consistent.
import { Week } from '@/types'

export const WEEKS_ADULT: Week[] = [
  { w: 1,  title: 'Managing the R',         sub: 'The one part you control when they melt down', color: '#0F2645', emoji: '⚡' },
  { w: 2,  title: 'Your 20 Square Feet',    sub: 'You cannot control your kid. You can control you.', color: '#1A5276', emoji: '📦' },
  { w: 3,  title: 'No BCD',                 sub: 'The habits that escalate every conflict', color: '#922B21', emoji: '🚫' },
  { w: 4,  title: 'No BCD in Action',       sub: 'Catch yourself before you react', color: '#1E8449', emoji: '✅' },
  { w: 5,  title: 'Discipline vs. Default', sub: 'Two responses. Every meltdown.', color: '#C94A0A', emoji: '🎯' },
  { w: 6,  title: 'Press Pause',            sub: 'The breath before you react', color: '#0077C2', emoji: '⏸️' },
  { w: 7,  title: 'Get Your Mind Right',    sub: 'What you focus on runs the moment', color: '#6C3FC5', emoji: '🧠' },
  { w: 8,  title: 'Step Up',                sub: 'Do the hard parent thing anyway', color: '#00875A', emoji: '💪' },
  { w: 9,  title: 'Adjust & Adapt',         sub: 'When the plan falls apart', color: '#B45309', emoji: '🔄' },
  { w: 10, title: 'Focus Frame',            sub: 'One bad moment is not the whole kid', color: '#1A6B5E', emoji: '🔍' },
  { w: 11, title: 'Power of Self Talk',     sub: 'The voice in your head at bedtime', color: '#8B2FC9', emoji: '💬' },
  { w: 12, title: 'Make a Difference',      sub: 'Your calm ripples to them', color: '#C81E4A', emoji: '⭐' },
  { w: 13, title: 'Build Skill',            sub: 'Reps make it automatic', color: '#3730A3', emoji: '🔨' },
]
