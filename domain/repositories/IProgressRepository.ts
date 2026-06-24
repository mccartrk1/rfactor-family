// domain/repositories/IProgressRepository.ts

export interface ProgressData {
  childId: string
  weekNumber: number
  completed: boolean
  completedAt: Date | null
  currentStep: string
  chunkIndex: number
  sealIndex: number
}

export interface ProgressUpdate {
  currentStep?: string
  chunkIndex?: number
  sealIndex?: number
  completed?: boolean
}

export interface IProgressRepository {
  /** Get all lesson progress records for a child. */
  findAllForChild(childId: string): Promise<ProgressData[]>

  /** Upsert progress for a specific week. Creates if absent, updates if present. */
  save(childId: string, weekNumber: number, update: ProgressUpdate): Promise<ProgressData>
}
