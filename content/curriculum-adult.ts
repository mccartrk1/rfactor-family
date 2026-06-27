// content/curriculum-adult.ts
//
// ADULT (parent) curriculum. Same R Factor spine as the kid program, reframed
// for the grown-up: the Event is your child's behavior, the Response is yours.
// Reuses the existing concept visuals (ero-hero, sqft-image, bcd-prohibition,
// bcd-tiles, bcd-to-resolution) — no new artwork needed.
import { Lesson } from '@/types'

export const LESSONS_ADULT: Record<number, Lesson> = {
  1: {
    keyLine: 'E + R = O',
    headline: 'You control more than you think.',
    body: 'Your kid melts down. Your partner pushes a button. You are already running late. You did not choose the Event. But the Response is yours, every single time.',
    note: 'This week, catch one moment where your kid sets you off. Before the next sentence leaves your mouth, name it silently: that is the Event. What is my Response?',
    recap: null,
    chunks: [
      { visual: 'ero-hero', teach: 'Three letters. One idea that holds under pressure. E is the Event — your kid does something. R is your Response — what you do next. O is the Outcome — how the moment goes. The only part you always control is the R.', check: { q: 'Which part do YOU always control?', opts: ['What your kid does', 'How you respond'], answer: 1 } },
      { teach: 'Their behavior is the Event. You did not choose it, and you cannot always stop it. But your Response is one hundred percent yours. No tantrum can take it from you.', check: { q: 'Your toddler throws the plate on the floor. That is the...', opts: ['Event', 'Response'], answer: 0 } },
      { visual: 'ero-example', teach: 'Same Event, two different Responses, two completely different Outcomes. The kid did the same thing. Your R changed where the whole night ended up.' },
      { teach: 'Every time you train your R, you do two things: you keep the moment from blowing up, and you show your kids what calm under fire looks like. They learn it by watching you find it.' },
    ],
    challenge: [
      'When your kid sets you off this week, say silently: that is the Event. What is my Response?',
      'Name E, R, and O out loud for one hard moment at home.',
      'Tell your partner what E+R=O means and pick one phrase you will both use.',
    ],
    seal: [
      { q: 'In E+R=O, which part do YOU always control?', opts: ['The Event', 'The Response'], answer: 1 },
      { q: 'E is the Event. O is the Outcome. What is R?', opts: ['Response', 'Reason'], answer: 0 },
    ],
  },
  2: {
    keyLine: 'Own your space.',
    headline: 'You cannot control your kid. You can control you.',
    body: 'Picture a box on the floor around you. Inside it is everything that is actually yours: your tone, your face, your words, your next move. Your child stands outside the box.',
    note: 'This week, when you feel the pull to force your kid into compliance, picture the box and ask: what is actually inside my 20 square feet right now?',
    recap: { emoji: '⚡', title: 'Last week: Managing the R', points: ['The Event is their behavior, not yours to control', 'You always control your Response', 'E + R = O'] },
    chunks: [
      { visual: 'sqft-image', teach: 'Two areas. Inside: your tone, your words, your face, how you respond. Outside: your child, the mess, the timing, what other people think. You can influence the outside. You cannot control it.', check: { q: 'Which one is inside your 20 square feet?', opts: ['Whether your kid obeys', 'Your tone when you ask'], answer: 1 } },
      { teach: 'Most parenting frustration lives in trying to control what is outside the box. Influence the outside, control the inside. That is where your power actually is.', check: { q: 'The kids are fighting in the back seat. What can you control?', opts: ['Whether they stop', 'How you respond'], answer: 1 } },
      { teach: 'Your 20 square feet goes everywhere with you — the grocery store, the bedtime standoff, the school pickup line. Own it, and you stop handing your calm to a six-year-old.' },
    ],
    challenge: [
      'When you feel the urge to control your kid, picture the box and name one thing inside it.',
      'When something is outside your space, say to yourself: not in my 20 square feet.',
      'Catch yourself once trying to control something you cannot — and let it go.',
    ],
    seal: [
      { q: 'Which one is inside your 20 square feet?', opts: ['Whether your kid listens', 'How YOU respond'], answer: 1 },
      { q: 'Outside your 20 square feet, you can...', opts: ['Control it if you try hard enough', 'Influence it, but not control it'], answer: 1 },
    ],
  },
  3: {
    keyLine: 'B. C. D.',
    headline: 'The habits that escalate every conflict.',
    body: 'When your kid pushes back, there is an automatic move. Blame them. Complain about them. Defend yourself. Grown-ups do BCD too, and it pours fuel on the fire.',
    note: 'This week, catch your own BCD with your kids. No shame. Just notice the move and name it to yourself.',
    recap: { emoji: '📦', title: 'Last week: Your 20 Square Feet', points: ['Inside = your tone, words, next move', 'Outside = your child, the mess, the timing', 'You influence the outside, you control the inside'] },
    chunks: [
      { visual: 'bcd-prohibition', teach: 'Three letters for the three most common ways grown-ups react when a kid acts up. Each one damages the relationship, wastes your energy, and keeps the moment stuck.' },
      { visual: 'bcd-tiles', teach: 'B is Blaming — you always, you never. C is Complaining — why can you not just listen. D is Defending — I already told you a hundred times. Same three habits, adult version.', check: { q: '"You ALWAYS make us late!" What is that?', opts: ['Blaming', 'Defending'], answer: 0 } },
      { teach: 'BCD signals that your kid is now running your outcome. The opposite is seeking resolution. Resolution asks what this moment actually needs.', check: { q: '"Why can you never just do what I say?" What is that?', opts: ['Seeking resolution', 'Complaining'], answer: 1 } },
      { teach: 'Venting about your kid is BCD too. If you bring it up to fix it, that is resolution. If you bring it up to unload, that is BCD wearing a calmer voice.' },
    ],
    challenge: [
      'When you catch your own BCD this week, name it silently: that was blaming.',
      'Catch yourself blaming, complaining, or defending one time before it takes over.',
      'Tell your partner what BCD stands for and agree to call it out gently in each other.',
    ],
    seal: [
      { q: 'What does BCD stand for?', opts: ['Blaming, Complaining, Defending', 'Boundaries, Calm, Discipline'], answer: 0 },
      { q: 'Venting about your kid is...', opts: ['Seeking resolution', 'BCD'], answer: 1 },
    ],
  },
  4: {
    keyLine: 'Catch it. Name it. Choose differently.',
    headline: 'Catch yourself before you react.',
    body: 'Knowing what BCD is and catching yourself mid-sentence are two different skills. This week is reps.',
    note: 'Model it out loud: "I was just blaming there. Let me try that again." That one sentence teaches your kids more than any lecture.',
    recap: { emoji: '🚫', title: 'Last week: No BCD', points: ['BCD escalates every conflict', 'Venting is BCD; seeking resolution is the opposite', 'Your BCD hands your kid the wheel'] },
    chunks: [
      { teach: 'The first step is just noticing. Catching yourself blaming is a win — it means you are awake inside the moment instead of running on autopilot.', check: { q: '"I would not yell if you would just behave." What is that?', opts: ['Seeking resolution', 'Blaming'], answer: 1 } },
      { visual: 'bcd-to-resolution', teach: 'Here is the swap. BCD keeps the moment stuck. Resolution moves it forward. Notice what each one actually sounds like out of your mouth.' },
      { teach: 'Once you catch it, switch. Instead of "why do you always," try "what do we need right now?" That one question changes where the moment lands.', check: { q: 'You catch yourself defending and instead ask what the moment needs. Is that BCD?', opts: ['Yes it is', 'No it is not'], answer: 1 } },
      { teach: 'You will not catch it every time. Nobody does. Every catch makes the next one faster — and your kids are watching you build the skill in real time.' },
    ],
    challenge: [
      'When you catch BCD this week, ask out loud: what do we need right now?',
      'Turn one BCD moment with your kid into a different response.',
      'At dinner, name one time you caught yourself and chose differently.',
    ],
    seal: [
      { q: 'When you catch your own BCD, the move is to...', opts: ['Push through and make your point', 'Name it and choose differently'], answer: 1 },
      { q: 'Instead of "why do you always," try asking...', opts: ['Why is this always so hard?', 'What do we need right now?'], answer: 1 },
    ],
  },
}
