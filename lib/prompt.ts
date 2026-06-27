// lib/prompt.ts
import { ChildProfile } from '@/types'
import { isAdultTrack } from '@/lib/tracks'

const SCENARIO_CONTEXTS = [
  'Morning routine — getting dressed, rushing, or something going wrong before school',
  'A sibling conflict — one sibling takes something, will not share, or starts an argument',
  'Screen time ending — TV turned off, device taken away, or a game paused unexpectedly',
  'Dinner or mealtime — food the child does not like, being told to finish, or something at the table',
  'Bedtime — not wanting to go to bed, stalling, or being overtired and reactive',
  'A car ride with the family — someone being annoying, a disagreement, or plans discussed on the way',
  'Losing a game — a video game, board game, or something competitive with a friend',
  'Plans changing unexpectedly — an outing cancelled, timing shifted, or something promised not happening',
  'A visit with a grandparent or close family member — being at their house or a moment with them',
  'Chores or responsibilities — something to finish before play or screen time',
  'Being nervous before something — a school event, performance, or trying something new',
  'A younger sibling doing something bothersome — getting away with things they should not',
  'Playing with friends — a disagreement, someone being left out, or a competition',
  'Getting in trouble for something a sibling started — taking the blame unfairly',
  'Homework or reading time — not wanting to do it, rushing, or getting frustrated',
  'Sharing space at home — the couch, TV remote, a toy, or a spot claimed first',
  'The babysitter is over — rules feel different than when parents are home',
  'A holiday or family gathering — relatives visiting, expectations, or something not going as planned',
]

const WEEK_TOPICS: Record<number, string> = {
  1: 'E+R=O — the core formula. Event + Response = Outcome. The child always controls the R.',
  2: 'Owning 20 square feet. Inside: what the child controls. Outside: what they can impact but not control.',
  3: 'Recognizing BCD — Blaming, Complaining, Defending. Three habits that keep people stuck.',
  4: 'No BCD in action: catching the impulse and choosing something different instead.',
  5: 'Discipline vs Default. Default: impulsive, autopilot, resistant. Discipline: intentional, purposeful, skillful.',
  6: 'Press Pause: noticing the physical signal and using one of the three pause types.',
  7: 'Get Your Mind Right: the Mindset Cycle. Focus drives Self-Talk drives Feelings drives Action.',
  8: 'Step Up: Win the Moment. Taking action even when not ready or comfortable.',
  9: 'Adjust and Adapt: when plans change, asking what to do now instead of shutting down.',
  10: 'Focus Frame: zooming out. One bad thing does not fill the whole picture.',
  11: 'Power of Self Talk: preloading before hard moments. The brain believes what you tell it.',
  12: 'Make a Difference: your R becomes an E for others. Small choices ripple outward.',
  13: 'Build Skill: deliberate practice. Failure is feedback. Habits under pressure.',
}

// Strip control characters and prompt-injection attempts from user text.
// Removes: backticks (code fences), \`ignore\` keyword sequences, and
// any text that looks like a system prompt injection.
// Note: Claude's JSON output constraint makes injection nearly impossible,
// but defense in depth costs nothing here.
function sanitizeForPrompt(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/`/g, "'")                           // no code fences
    .replace(/\n/g, ' ')                          // no newlines inside fields
    .replace(/ignore (all |previous |prior )?instructions?/gi, '[removed]')
    .replace(/system prompt/gi, '[removed]')
    .trim()
    .slice(0, 100)                                // hard cap per field
}

// ─── Adult (parent) program ───────────────────────────────────────────────────
// Parenting flashpoints. The Event is the child's behavior; the Response the
// scenario trains is the PARENT's.
const ADULT_CONTEXTS = [
  'Your child melts down in a store or public place over something small',
  'Your kids are fighting and both are yelling for you to take a side',
  'Morning chaos — nobody is dressed, you are running late, a kid refuses to move',
  'A screen-time battle — you say time is up and your child argues or ignores you',
  'Bedtime resistance — stalling, getting out of bed, big feelings when overtired',
  'Your child talks back or says something disrespectful',
  'A spill, a broken thing, or a mess right after you just cleaned up',
  'A homework or chores standoff — flat refusal or melting down over it',
  'Your child denies something you clearly saw them do',
  'You are exhausted and your kid pushes the exact button that sets you off',
  'A tantrum over a "no" — candy, a toy, or staying somewhere longer',
  'Tattling and blame — "he started it," "she always gets away with it"',
  'Getting everyone out the door while one kid stalls',
  'Your child ignores you after you have asked three times',
]

const ADULT_WEEK_TOPICS: Record<number, string> = {
  1: "E+R=O for the parent. The Event is the child's behavior. The Response is the parent's. The parent always controls the R.",
  2: 'Owning your 20 square feet as a parent. Inside: your tone, your words, your next move. Outside: your child, the mess, the timing.',
  3: 'Recognizing your OWN BCD — Blaming, Complaining, Defending — when your kid pushes back.',
  4: 'No BCD in action: catching your own reactive habit mid-moment and choosing resolution instead.',
}

function buildAdultPrompt(child: ChildProfile, weekNumber: number, attempt: number): string {
  const contextIndex = ((weekNumber - 1) + attempt * 3) % ADULT_CONTEXTS.length
  const context = ADULT_CONTEXTS[contextIndex]
  const topic = ADULT_WEEK_TOPICS[weekNumber] ?? ADULT_WEEK_TOPICS[1]
  const kids = sanitizeForPrompt(child.siblings) || 'not listed'
  const trigger = sanitizeForPrompt(child.flashPoint)
  const sitter = sanitizeForPrompt(child.babysitter)

  const profileLines = [
    `Parent name: ${sanitizeForPrompt(child.name)}`,
    `Their kids: ${kids}`,
    sitter ? `Babysitter or caregiver: ${sitter}` : null,
    trigger ? `Parent's biggest trigger: ${trigger}` : null,
  ].filter(Boolean).join('\n- ')

  return `You are an R Factor coach for a PARENT practicing E+R=O on their own response.

Parent profile:
- ${profileLines}

This week's R Factor concept: ${topic}

Specific situation to write about: ${context}

Write ONE realistic at-home parenting moment in SECOND PERSON throughout — "you" is the PARENT, never the child. The child's behavior is the Event. The disciplinePath and defaultPath are the PARENT'S two possible Responses, and the results are what happens with the child and the household next. If the kids' names are known (${kids}), use them naturally; otherwise write "your child" or "your kids." Keep it warm, real, and free of shame.

Return ONLY this JSON with no extra text:
{"setup":"2-3 sentences in second person setting the scene as the parent.","event":"What your child does — the hard moment. One sentence.","disciplinePath":{"choice":"The disciplined parent response. 1-2 sentences.","result":"What happens with your child next. One sentence."},"defaultPath":{"choice":"The automatic, reactive parent response. 1-2 sentences.","result":"What happens with your child next. One sentence."},"question":"One reflection question for the parent after reading this."}`
}

export function buildPrompt(child: ChildProfile, weekNumber: number, attempt: number): string {
  if (isAdultTrack(child.track)) {
    return buildAdultPrompt(child, weekNumber, attempt)
  }
  const contextIndex = ((weekNumber - 1) + attempt * 3) % SCENARIO_CONTEXTS.length
  const context = SCENARIO_CONTEXTS[contextIndex]
  const topic = WEEK_TOPICS[weekNumber]
  const siblingInfo = sanitizeForPrompt(child.siblings) || 'none listed'

  // PERF FIX 5: Only include non-empty fields. A sparse profile (many 'not specified'
  // lines) wastes tokens without adding useful context for Claude.
  const profileLines = [
    `Name: ${sanitizeForPrompt(child.name)} ${sanitizeForPrompt(child.familyName)}`,
    `Age: ${child.age}${child.grade ? `, Grade: ${child.grade}` : ''}`,
    child.school ? `School: ${child.school}${child.mascot ? ` (mascot: ${child.mascot})` : ''}` : null,
    child.bestFriend ? `Best friend: ${child.bestFriend}` : null,
    child.friends ? `Other friends: ${child.friends}` : null,
    child.activity || child.game ? `Loves: ${[child.activity, child.game].filter(Boolean).join(' and ')}` : null,
    child.athlete ? `Hero: ${child.athlete}${child.team ? ` | Team: ${child.team}` : ''}` : null,
    child.grandparent ? `Calls grandparent: ${child.grandparent}` : null,
    child.trustedAdults ? `Trusted adults: ${child.trustedAdults}` : null,
    child.babysitter ? `Babysitter: ${child.babysitter}` : null,
    child.hardThing ? `Something hard: ${child.hardThing}` : null,
    child.flashPoint ? `Biggest trigger: ${child.flashPoint}` : null,
    `Siblings: ${siblingInfo}`,
  ].filter(Boolean).join('\n- ')

  return `You are an R Factor behavioral coach for children using E+R=O.

Child profile:
- ${profileLines}

This week's R Factor concept: ${topic}

Specific context to use (write about THIS situation): ${context}

Write ONE scenario in SECOND PERSON throughout — always "you" and "your," never the child's name inside the scenario text. If siblings exist (${siblingInfo}), always use their actual names — never "your sibling."

Return ONLY this JSON with no extra text:
{"setup":"2-3 sentences in second person setting the scene.","event":"The hard moment. One sentence.","disciplinePath":{"choice":"The disciplined response. 1-2 sentences.","result":"What happens next. One sentence."},"defaultPath":{"choice":"The automatic/impulsive reaction. 1-2 sentences.","result":"What happens next. One sentence."},"question":"One discussion question to ask the child after reading this."}`
}
