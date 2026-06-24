// application/ports/IScenarioCache.ts

import type { ScenarioPayload } from './IScenarioGenerator'

export interface IScenarioCache {
  get(childId: string, weekNumber: number, attempt: number): Promise<ScenarioPayload | null>
  set(childId: string, weekNumber: number, attempt: number, scenario: ScenarioPayload): Promise<void>
  exists(childId: string, weekNumber: number, attempt: number): Promise<boolean>
}
