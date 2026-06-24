// types/index.ts

export interface ChildProfile {
  id: string
  familyId: string
  name: string
  familyName: string
  age: string
  grade: string
  school: string
  mascot: string
  teacher: string
  bestFriend: string
  friends: string
  activity: string
  game: string
  loveFood: string
  hateFood: string
  athlete: string
  team: string
  grandparent: string
  trustedAdults: string
  babysitter: string
  hardThing: string
  flashPoint: string
  siblings: string
  track: string
}

export interface LessonProgress {
  childId: string
  weekNumber: number
  completed: boolean
  completedAt: string | null
  currentStep: LessonStep
  chunkIndex: number
  sealIndex: number
}

export type LessonStep =
  | 'intro'
  | 'teaching'
  | 'seal'
  | 'loading'
  | 'scenario'
  | 'challenge'
  | 'pledge'
  | 'complete'

export interface ChallengeResponse {
  weekNumber: number
  response: 'yes' | 'not-yet'
}

export interface ScenarioPayload {
  setup: string
  event: string
  disciplinePath: { choice: string; result: string }
  defaultPath: { choice: string; result: string }
  question: string
  icon?: string
}

export interface Week {
  w: number
  title: string
  sub: string
  color: string
  emoji: string
}

export interface CheckQuestion {
  q: string
  opts: [string, string]
  answer: 0 | 1
}

export interface InsteadOfPair {
  before: string
  after: string
}

export interface LessonChunk {
  visual?: string
  title?: string
  subtitle?: string
  traits?: string[]
  pairs?: InsteadOfPair[]
  teach: string
  check?: CheckQuestion
}

export interface SealQuestion {
  q: string
  opts: [string, string]
  answer: 0 | 1
}

export interface RecapData {
  emoji: string
  title: string
  points: string[]
}

export interface Lesson {
  keyLine: string
  headline: string
  body: string
  note: string
  recap: RecapData | null
  chunks: LessonChunk[]
  challenge: [string, string, string]
  seal: [SealQuestion, SealQuestion]
}
