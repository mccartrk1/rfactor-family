// application/ports/IScenarioGenerator.ts
//
// Interface for AI scenario generation. The application layer depends on this,
// never on Claude directly. Swap implementations without touching use cases.

import type { ChildProfileData } from '@/domain/entities/ChildProfile'

export interface ScenarioPayload {
  setup: string
  event: string
  disciplinePath: { choice: string; result: string }
  defaultPath: { choice: string; result: string }
  question: string
}

export interface IScenarioGenerator {
  generate(
    profile: ChildProfileData,
    weekNumber: number,
    attempt: number
  ): Promise<ScenarioPayload>
}
