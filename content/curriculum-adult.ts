// content/curriculum-adult.ts
//
// ADULT (parent) curriculum — full 13 weeks. Same R Factor spine as the kid
// program, reframed for the grown-up: the Event is your child's behavior, the
// Response is yours. Reuses the existing concept visuals (ero-hero, sqft-image,
// bcd-*, character-bot/tiger, radio, comparison, three-pause, mindset-cycle,
// thought-card, instead-of-*, step-up-four, adjust-three-ways, zoom-card,
// ripple-card, skill-bar) — no new artwork needed.
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
  5: {
    keyLine: 'Discipline or Default.',
    headline: 'Every hard moment with your kid is a choice.',
    body: 'When your kid pushes back, two responses show up in you. One is automatic. One is chosen. You decide which one runs the moment.',
    note: 'Use Discipline and Default as a lens this week. After a hard moment, ask yourself: was that Discipline or Default? No judgment. Just notice.',
    recap: { emoji: '✅', title: 'Last week: No BCD in Action', points: ['Catching your own BCD is a win', 'Swap blame for "what do we need right now?"', 'Every catch makes the next one faster'] },
    chunks: [
      { visual: 'character-bot', title: 'Default 🤖', traits: ['Impulsive', 'Autopilot', 'Resistant'], teach: 'Default shows up the second your kid does something hard. It reacts before thinking. It does whatever is easiest in the moment — usually louder. It is not chosen. It just runs when you are not paying attention.', check: { q: 'When Default is running, you...', opts: ['Think before you respond', 'React before you think'], answer: 1 } },
      { visual: 'character-tiger', title: 'Discipline 🐯', traits: ['Intentional', 'Purposeful', 'Skillful'], teach: 'Discipline is intentional — it thinks before it acts. Purposeful — it knows the kind of parent it wants to be. Skillful — it gets better with reps. This is the version of you that you are proud of after the kids are in bed.', check: { q: 'Discipline is...', opts: ['Impulsive and automatic', 'Intentional and purposeful'], answer: 1 } },
      { visual: 'radio', teach: 'Your brain is like a radio. Default runs the Default Station — it plays whatever reaction comes first. Discipline runs the Discipline Station — you choose what plays. You always control the dial, even when your kid is screaming.', check: { q: 'Who controls which station plays?', opts: ['Your kid sets it off', 'You decide'], answer: 1 } },
      { visual: 'comparison', teach: 'Here is the difference side by side. Default or Discipline. Every time your kid melts down, you pick which one shows up — and they learn which one is normal by watching you.' },
      { teach: 'Default is not bad on purpose. It is just automatic, especially when you are tired. Every time you pick Discipline, you get a little stronger at it.', check: { q: 'Your kid slams a door and you feel like yelling. Discipline would...', opts: ['Yell back to be heard', 'Take a breath and choose'], answer: 1 } },
    ],
    challenge: [
      'When something hard happens with your kid, ask yourself: Default or Discipline?',
      'Catch Default once before it takes over.',
      'Tell your partner one moment you chose Discipline this week.',
    ],
    seal: [
      { q: 'Discipline means being intentional, purposeful, and...', opts: ['Impulsive', 'Skillful'], answer: 1 },
      { q: 'When you drift to autopilot and react loud, you are in...', opts: ['Discipline', 'Default'], answer: 1 },
    ],
  },
  6: {
    keyLine: 'Press Pause.',
    headline: 'The breath before you react.',
    body: 'Between what your kid does and what you do, there is a gap. Default skips it. Discipline lives in it. That gap is the pause.',
    note: 'This week, find your physical signal — jaw tight, chest hot, voice rising. That signal is your cue to pause. Name it to yourself the moment you feel it.',
    recap: { emoji: '🎯', title: 'Last week: Discipline vs. Default', points: ['Two responses show up — one automatic, one chosen', 'You always control the dial', 'Picking Discipline gets stronger with reps'] },
    chunks: [
      { visual: 'tiger-pause-img', teach: 'Press Pause is not doing nothing. It is the one beat where you feel the heat rise and choose not to act on it yet. That beat is where every good response is born.' },
      { visual: 'body-cues', teach: 'Your body warns you before you blow. Jaw clenches. Chest tightens. Face gets hot. Voice climbs. Those are not the problem — they are the signal. Catch the signal, and you catch the pause.', check: { q: 'A tight chest and a rising voice are...', opts: ['A reason to let it out', 'Your cue to pause'], answer: 1 } },
      { visual: 'three-pause', teach: 'Three ways to pause: one breath, a few steps away, or a single sentence like "give me a second." Pick one before the moment, so it is ready when you need it.', check: { q: 'Walking to the sink for ten seconds before you respond is...', opts: ['Avoiding the problem', 'A pause'], answer: 1 } },
      { visual: 'character-bot', title: 'Default 🤖', subtitle: 'Reacts the second the kid pushes back. No breath. No pause. Just go — and it almost always escalates.', teach: 'Default never finds the gap. It is already yelling before it knows what happened.' },
      { visual: 'character-tiger', title: 'Discipline 🐯', subtitle: 'Feels the heat — jaw tight, voice climbing — and takes one breath first. That one breath is the whole skill.', teach: 'Discipline feels the exact same heat. It just adds one breath before the response. That breath changes everything.' },
    ],
    challenge: [
      'When you feel your signal this week, take one breath before you say anything.',
      'Pick your pause move in advance and use it once.',
      'Tell your kids: when I say "give me a second," that is me pressing pause.',
    ],
    seal: [
      { q: 'Press Pause is the gap between...', opts: ['Two of your kids fighting', 'What happens and what you do'], answer: 1 },
      { q: 'Your tight jaw and hot face are...', opts: ['Proof you should react', 'Your cue to pause'], answer: 1 },
    ],
  },
  7: {
    keyLine: 'Get your mind right.',
    headline: 'What you focus on runs the moment.',
    body: 'Your reaction does not start with your kid. It starts in your head. Focus drives Self-Talk, Self-Talk drives Feelings, Feelings drive Action. Change the focus and you change the whole chain.',
    note: 'This week, catch your focus mid-moment. If you are locked on "he is doing this on purpose," your self-talk and your tone follow. Shift the focus and watch the rest shift with it.',
    recap: { emoji: '⏸️', title: 'Last week: Press Pause', points: ['There is a gap between the Event and your response', 'Your body signals you before you blow', 'One breath is the whole skill'] },
    chunks: [
      { visual: 'mindset-cycle', teach: 'The cycle: what you Focus on drives your Self-Talk, your Self-Talk drives your Feelings, your Feelings drive your Action. It runs in order, every time. The good news — you can grab it at the Focus.', check: { q: 'In the Mindset Cycle, what comes first?', opts: ['Your action', 'Your focus'], answer: 1 } },
      { visual: 'thought-card', teach: 'Focus on "she never listens" and your self-talk turns sour, your chest tightens, and you snap. Focus on "she is having a hard time" and the whole chain softens. Same kid. Different focus.', check: { q: 'If your feelings are running hot, the fastest fix is to change your...', opts: ['Kid', 'Focus and self-talk'], answer: 1 } },
      { visual: 'instead-of-7', pairs: [{ before: 'He never listens.', after: 'He is having a hard time right now.' }, { before: 'I cannot do this.', after: 'I have handled hard moments before.' }, { before: 'I always lose it.', after: 'I am still building this skill.' }], teach: 'Swap the focus, swap the line you tell yourself. Here are three trades that change the moment.' },
      { teach: 'Getting your mind right is not pretending everything is fine. It is choosing what you aim your attention at when it matters most. Aim it at what you can do next.' },
    ],
    challenge: [
      'When you feel yourself heating up, name what you are focused on.',
      'Trade one harsh thought about your kid for a truer, calmer one.',
      'Tell your partner the Mindset Cycle: Focus, Self-Talk, Feelings, Action.',
    ],
    seal: [
      { q: 'The Mindset Cycle goes Focus, Self-Talk, Feelings, and then...', opts: ['Action', 'Outcome'], answer: 0 },
      { q: 'To change your feelings in the moment, change your...', opts: ['Kid', 'Focus'], answer: 1 },
    ],
  },
  8: {
    keyLine: 'Step up. Win the moment.',
    headline: 'Do the hard parent thing anyway.',
    body: 'Sometimes the right move is the hard one — follow through on the no, stay calm when you want to yell, have the conversation you would rather skip. You will not feel ready. Step up anyway.',
    note: 'This week, notice the moment you want to take the easy way — cave on the limit, let it slide, walk off. That is the moment to step up. Win that one.',
    recap: { emoji: '🧠', title: 'Last week: Get Your Mind Right', points: ['Focus drives Self-Talk drives Feelings drives Action', 'Grab the chain at the Focus', 'Aim your attention at what you can do next'] },
    chunks: [
      { visual: 'step-up-four', teach: 'Stepping up is four beats: see the moment, feel the pull to avoid it, choose to act, and do it before you feel ready. Ready never fully comes. You go, then the confidence shows up.', check: { q: 'When do you step up?', opts: ['Once you finally feel ready', 'Even when you do not feel ready'], answer: 1 } },
      { visual: 'character-bot', title: 'Default 🤖', subtitle: 'Caves to keep the peace, or checks out and lets it slide. Easier right now. Harder for everyone later.', teach: 'Default takes the path of least resistance. It feels like calm. It is really just avoidance.' },
      { visual: 'character-tiger', title: 'Discipline 🐯', subtitle: 'Holds the limit kindly. Has the hard talk. Stays in the room. Not because it is easy — because it is right.', teach: 'Discipline steps up while still nervous or tired. That is the whole skill. Win the moment in front of you.', check: { q: 'Stepping up means acting...', opts: ['Only when it feels comfortable', 'Even while it feels hard'], answer: 1 } },
      { teach: 'You will not win every moment. Nobody does. But every time you step up when it is hard, you get stronger — and your kids see what showing up looks like.' },
    ],
    challenge: [
      'When you want to take the easy way out, step up instead — once.',
      'Hold one limit calmly all the way through.',
      'Tell your kids about a time you did the hard thing even though you were nervous.',
    ],
    seal: [
      { q: 'Stepping up means acting...', opts: ['When you finally feel ready', 'Even when you do not feel ready'], answer: 1 },
      { q: 'Caving to keep the peace is...', opts: ['Discipline', 'Default'], answer: 1 },
    ],
  },
  9: {
    keyLine: 'Adjust and adapt.',
    headline: 'When the plan falls apart.',
    body: 'The outing gets cancelled. The kid melts down and derails the morning. The plan you had is gone. Default doubles down. Discipline asks one question: what do I do now?',
    note: 'This week, when a plan blows up, catch the urge to push the old plan harder. Stop. Ask what the new moment actually needs.',
    recap: { emoji: '💪', title: 'Last week: Step Up', points: ['Do the hard thing before you feel ready', 'Hold the limit kindly', 'Winning the moment is the skill'] },
    chunks: [
      { visual: 'adjust-three-ways', teach: 'When conditions change, you have three moves: change the plan, change the approach, or change the timing. What you do not do is keep ramming the old plan into a wall.', check: { q: 'When the plan stops working, the move is to...', opts: ['Push the old plan harder', 'Adjust to the new conditions'], answer: 1 } },
      { visual: 'change-conditions', teach: 'Kids change the conditions constantly — moods, energy, surprises. That is not them ruining your plan. That is parenting. Adapting to it is the job, not the interruption to the job.' },
      { visual: 'instead-of-9', pairs: [{ before: 'This is not how it was supposed to go!', after: 'Okay — what do we do now?' }, { before: 'Why does this always happen to me?', after: 'What does this moment need?' }, { before: 'I give up.', after: 'Let me try one different thing.' }], teach: 'When the plan dies, your self-talk decides what happens next. Trade the protest for a question.' },
      { visual: 'character-tiger', title: 'Discipline 🐯', subtitle: 'Drops the dead plan. Does not blame the change. Asks: what do I do now? — and tries one new thing.', teach: 'Discipline does not need the day to go as planned to stay steady. It bends without breaking.', check: { q: 'Adjusting starts with which question?', opts: ['Why is this happening to me?', 'What do I do now?'], answer: 1 } },
    ],
    challenge: [
      'When a plan falls apart this week, ask out loud: what do we do now?',
      'Adjust one approach instead of forcing the old plan.',
      'At dinner, share one time you rolled with a change instead of fighting it.',
    ],
    seal: [
      { q: 'When the plan falls apart, Discipline asks...', opts: ['Why does this always happen?', 'What do I do now?'], answer: 1 },
      { q: 'Pushing the dead plan harder and louder is...', opts: ['Adjusting', 'Default'], answer: 1 },
    ],
  },
  10: {
    keyLine: 'Zoom out.',
    headline: 'One bad moment is not the whole kid.',
    body: 'In the heat of a tantrum, the frame shrinks to this one awful moment. It feels like proof your kid is impossible and you are failing. Zoom out, and the picture is much bigger.',
    note: 'This week, when a moment feels huge, literally widen the frame. Ask: how big is this in a week? In a year? Most fires are smaller than they feel.',
    recap: { emoji: '🔄', title: 'Last week: Adjust & Adapt', points: ['Change the plan, the approach, or the timing', 'Kids change the conditions — that is the job', 'Trade the protest for "what do I do now?"'] },
    chunks: [
      { visual: 'zoom-card', teach: 'When you are zoomed all the way in, one meltdown fills the whole screen. Zoom out and you see a tired kid, a long day, and a relationship that is mostly good. Same moment, truer picture.', check: { q: 'When a hard moment feels huge, the move is to...', opts: ['Zoom in on everything wrong', 'Zoom out and widen the frame'], answer: 1 } },
      { visual: 'thought-card', teach: 'The frame "he is a nightmare today" makes every behavior worse in your eyes. The frame "he is six and overtired" lets you respond to the kid in front of you instead of the story in your head.', check: { q: '"My kid is impossible" is a frame that...', opts: ['Helps you respond well', 'Makes the moment worse'], answer: 1 } },
      { teach: 'Zooming out is not excusing the behavior. It is sizing it correctly so your response fits the actual moment, not the panic. Hold the limit and keep the frame wide.' },
    ],
    challenge: [
      'When a moment feels huge, ask: how big is this in a week?',
      'Catch one "always" or "never" story about your kid and widen it.',
      'Name one thing your kid did well today, out loud, in front of them.',
    ],
    seal: [
      { q: 'When a hard moment feels enormous, you should...', opts: ['Zoom in on every problem', 'Zoom out and widen the frame'], answer: 1 },
      { q: 'Zooming out means you...', opts: ['Excuse the behavior', 'Size it correctly'], answer: 1 },
    ],
  },
  11: {
    keyLine: 'The voice in your head.',
    headline: 'Preload before the hard moment.',
    body: 'Bedtime is coming. The witching hour is coming. You know the hard moment is on its way. The voice you load before it arrives decides how you show up.',
    note: 'This week, preload one line before a moment you know will be hard. "Bedtime is coming. I will stay steady." Say it before, not during.',
    recap: { emoji: '🔍', title: 'Last week: Focus Frame', points: ['One bad moment is not the whole kid', 'Widen the frame to size it right', 'Hold the limit and keep the frame wide'] },
    chunks: [
      { visual: 'thought-card', teach: 'Your brain believes what you tell it most. Walk into bedtime telling yourself "this is going to be a fight" and you are already braced for war. The story you load shapes the response you give.', check: { q: 'The voice you load before a hard moment...', opts: ['Does not really matter', 'Shapes how you show up'], answer: 1 } },
      { visual: 'instead-of-11', pairs: [{ before: 'I am going to lose it.', after: 'I can stay steady through this.' }, { before: 'He is doing this on purpose.', after: 'He needs me calm right now.' }, { before: 'I cannot do bedtime again.', after: 'I can do hard and tired at the same time.' }], teach: 'Preloaded lines beat in-the-moment scrambling. Trade the brace for a steadier line.' },
      { teach: 'Self-talk is not fake positivity. It is choosing the truest, most useful sentence on purpose, before the heat hits — so it is already loaded when you need it.', check: { q: 'Good self-talk means saying something...', opts: ['Fake and cheerful', 'True and useful'], answer: 1 } },
    ],
    challenge: [
      'Preload one steady line before a moment you know will be hard.',
      'Catch one "I am going to lose it" and trade it for a calmer truth.',
      'Teach your kids one line they can tell themselves before something hard.',
    ],
    seal: [
      { q: 'The best time to load your self-talk is...', opts: ['In the middle of the meltdown', 'Before the hard moment'], answer: 1 },
      { q: 'Good self-talk is true and...', opts: ['Useful', 'Loud'], answer: 0 },
    ],
  },
  12: {
    keyLine: 'Make a difference.',
    headline: 'Your calm ripples to them.',
    body: 'Your Response is the next Event your kid reacts to. The way you handle the moment becomes the thing they respond to. Your calm spreads. So does your storm.',
    note: 'This week, notice one moment where your steadiness changed the room — a kid settled because you stayed calm. That is the ripple. Look for it.',
    recap: { emoji: '💬', title: 'Last week: Power of Self Talk', points: ['Your brain believes what you tell it most', 'Preload the line before the hard moment', 'True and useful beats loud'] },
    chunks: [
      { visual: 'ripple-card', teach: 'Drop a stone in water and the rings spread out. Your Response is the stone. Stay calm and the calm reaches your kid, then the room, then the whole evening. Blow up and that spreads just as far.', check: { q: 'To your kid, your Response is the next...', opts: ['Punishment', 'Event'], answer: 1 } },
      { visual: 'character-tiger', title: 'Discipline 🐯', subtitle: 'Notices the chance to steady the room. Shows up calm on purpose. Adds to the people nearby instead of subtracting.', teach: 'You set the emotional thermostat in your home. When you regulate, they borrow it. That is the most powerful R you have.' },
      { visual: 'activity-prompt', teach: 'You do not have to be perfect to make a difference. You just have to be the calmest person in the room a little more often than not. Reps add up. The kids feel it.' },
    ],
    challenge: [
      'Catch one moment your calm settled your kid, and notice it.',
      'Be the calmest person in one hard moment this week, on purpose.',
      'Tell your kids: how I respond changes how our night goes.',
    ],
    seal: [
      { q: 'To your kid, your Response is the next...', opts: ['Event', 'Excuse'], answer: 0 },
      { q: 'In your home, you set the...', opts: ['Rules only', 'Emotional thermostat'], answer: 1 },
    ],
  },
  13: {
    keyLine: 'Practice makes permanent.',
    headline: 'Reps make it automatic.',
    body: 'E+R=O is not a fact you learn once. It is a skill you build. The parents who stay calm under fire are not born that way — they have more reps than everyone else.',
    note: 'This week, treat every hard moment as a rep, not a test. Missed one? That is feedback, not failure. Run it back tomorrow.',
    recap: { emoji: '⭐', title: 'Last week: Make a Difference', points: ['Your Response is your kid\'s next Event', 'You set the emotional thermostat', 'Calm a little more often than not'] },
    chunks: [
      { visual: 'skill-bar', teach: 'Every skill builds the same way: reps under pressure. The first calm response is hard. The hundredth is closer to automatic. You are not failing when it is hard — you are early in the reps.', check: { q: 'A calm response gets easier because of...', opts: ['Luck and good kids', 'Reps under pressure'], answer: 1 } },
      { teach: 'Failure is feedback. The night you lost it tells you exactly where the next rep is. Look at it without shame, take the note, and run it back. That is how the skill grows.', check: { q: 'A moment you handled badly is...', opts: ['Proof you are a bad parent', 'Feedback for the next rep'], answer: 1 } },
      { teach: 'You have the R Factor skills now: manage the R, own your 20 square feet, drop BCD, press pause, get your mind right, step up, and make a difference. The work from here is reps. Keep showing up. The calm becomes who you are.' },
    ],
    challenge: [
      'Treat every hard moment this week as a rep, not a test.',
      'When you miss one, name the note and run it back tomorrow.',
      'Pick the one R Factor skill you want more reps on, and use it on purpose.',
    ],
    seal: [
      { q: 'When you handle a moment badly, it is...', opts: ['Proof you cannot do this', 'Feedback for the next rep'], answer: 1 },
      { q: 'E+R=O is...', opts: ['A fact you learn once', 'A skill you build with reps'], answer: 1 },
    ],
  },
}
