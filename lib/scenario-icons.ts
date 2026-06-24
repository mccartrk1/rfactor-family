// lib/scenario-icons.ts
// Single source of truth for scenario context detection and icon mapping.
// Used by lesson client for display; extensible for server-side og:image generation.

import { ScenarioPayload } from '@/types'

export interface IconEntry {
  img: string | null
  emoji: string
}

export const CONTEXT_ICON_MAP: Record<string, IconEntry> = {
  sibling:     { img: '/images/sibling-conflict.png', emoji: '👊' },
  morning:     { img: '/images/morning.png',          emoji: '🌅' },
  dinner:      { img: '/images/dinner.png',           emoji: '🍽️' },
  screen:      { img: '/images/screen-time.png',      emoji: '📺' },
  bedtime:     { img: '/images/bedtime.png',          emoji: '🌙' },
  car:         { img: '/images/car-ride.png',         emoji: '🚗' },
  game:        { img: '/images/losing-game.png',      emoji: '🎮' },
  friends:     { img: '/images/friends.png',          emoji: '🤜' },
  grandparent: { img: '/images/grandparent.png',      emoji: '👵' },
  homework:    { img: '/images/homework.png',         emoji: '📚' },
  chores:      { img: '/images/chores.png',           emoji: '🧹' },
  nerves:      { img: '/images/nerves-stage.png',     emoji: '😰' },
  plans:       { img: '/images/plans-changed.png',    emoji: '📅' },
  sharing:     { img: '/images/sharing-space.png',    emoji: '🛋️' },
  babysitter:  { img: null,                           emoji: '👩' },
  holiday:     { img: null,                           emoji: '🎉' },
  other:       { img: null,                           emoji: '⭐' },
}

export function detectScenarioIcon(scenario: ScenarioPayload): string {
  if (!scenario) return 'other'
  const t = ((scenario.setup || '') + ' ' + (scenario.event || '')).toLowerCase()
  const has = (words: string[]) => words.some(w => t.includes(w))

  if (has(['dinner', 'broccoli', 'mashed', 'vegetables', 'carrots', 'supper', 'at the table', 'mom put', 'mom puts', 'eat your', 'finish your plate', 'at dinner'])) return 'dinner'
  if (has(['nick', 'michael', 'sibling', 'brother', 'snatch', 'grabbed it', 'took it', 'his turn', 'wont share', 'wont let me', 'took mine'])) return 'sibling'
  if (has(['morning', 'school bus', 'running late', 'alarm', 'get dressed', 'before school', 'getting ready', 'woke up'])) return 'morning'
  if (has(['tv', 'television', 'tablet', 'screen time', 'video game', 'mario kart', 'mario', 'gaming', 'controller', 'console', 'playing a game', 'watch a show'])) return 'screen'
  if (has(['in the car', 'car ride', 'driving', 'back seat', 'road trip', 'on the way'])) return 'car'
  if (has(['gio', 'vinny', 'caden', 'griffin', 'playing with', 'at the park', 'friend at', 'friends came', 'recess', 'playground'])) return 'friends'
  if (has(['homework', 'reading log', 'worksheet', 'math problems', 'spelling', 'studying', 'do your homework'])) return 'homework'
  if (has(['bedtime', 'time for bed', 'go to sleep', 'lights out', 'pillow', 'night time', 'staying up'])) return 'bedtime'
  if (has(['gaga', 'nana', 'pappy', 'grandma', 'grandpa', 'grandparent', 'at grandma', 'visiting gaga'])) return 'grandparent'
  if (has(['chores', 'clean your room', 'put away', 'laundry', 'dishes', 'sweep', 'wipe down', 'tidy up', 'clean up', 'hang up your', 'put your shoes'])) return 'chores'
  if (has(['nervous', 'scared', 'anxious', 'worried', 'performing', 'audition', 'try out', 'standing in front', 'stage', 'new student'])) return 'nerves'
  if (has(['plans changed', 'cancelled', 'called off', 'changed the plans', 'instead of'])) return 'plans'
  if (has(['couch', 'remote', 'tv remote', 'sofa', 'living room', 'same spot', 'sitting in'])) return 'sharing'
  if (has(['sam', 'babysitter', 'sitter', 'watching you tonight'])) return 'babysitter'
  if (has(['christmas', 'holiday', 'birthday party', 'thanksgiving', 'gathering', 'family over', 'relatives'])) return 'holiday'
  return 'other'
}

export function getIconData(scenario: ScenarioPayload): IconEntry {
  const key = detectScenarioIcon(scenario)
  return CONTEXT_ICON_MAP[key] ?? CONTEXT_ICON_MAP.other
}
