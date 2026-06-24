// domain/entities/ChildProfile.ts
//
// Validated value object. Business rules about what a valid child profile looks
// like live here — not in an HTTP route handler, not in a Prisma schema.
//
// Construction either succeeds (returns ChildProfile) or throws a domain error
// with a specific message. Callers don't need to know about Prisma or HTTP.

export class ChildProfileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChildProfileError'
  }
}

export interface ChildProfileData {
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

export class ChildProfile {
  readonly id: string
  readonly familyId: string
  readonly name: string
  readonly familyName: string
  readonly age: string
  readonly grade: string
  readonly school: string
  readonly mascot: string
  readonly teacher: string
  readonly bestFriend: string
  readonly friends: string
  readonly activity: string
  readonly game: string
  readonly loveFood: string
  readonly hateFood: string
  readonly athlete: string
  readonly team: string
  readonly grandparent: string
  readonly trustedAdults: string
  readonly babysitter: string
  readonly hardThing: string
  readonly flashPoint: string
  readonly siblings: string
  readonly track: string

  private constructor(data: ChildProfileData) {
    Object.assign(this, data)
  }

  // Factory: validates and constructs.
  // Throws ChildProfileError on invalid input — callers handle at the use case layer.
  static create(data: Partial<ChildProfileData> & { id: string; familyId: string }): ChildProfile {
    const name = String(data.name ?? '').trim()
    if (!name) throw new ChildProfileError('Child name is required')
    if (name.length > 50) throw new ChildProfileError('Child name must be 50 characters or fewer')

    const familyId = String(data.familyId ?? '').trim()
    if (!familyId) throw new ChildProfileError('Family ID is required')

    return new ChildProfile({
      id: data.id,
      familyId,
      name,
      familyName:   String(data.familyName   ?? '').trim(),
      age:          String(data.age           ?? '').trim(),
      grade:        String(data.grade         ?? '').trim(),
      school:       String(data.school        ?? '').trim(),
      mascot:       String(data.mascot        ?? '').trim(),
      teacher:      String(data.teacher       ?? '').trim(),
      bestFriend:   String(data.bestFriend    ?? '').trim(),
      friends:      String(data.friends       ?? '').trim(),
      activity:     String(data.activity      ?? '').trim(),
      game:         String(data.game          ?? '').trim(),
      loveFood:     String(data.loveFood      ?? '').trim(),
      hateFood:     String(data.hateFood      ?? '').trim(),
      athlete:      String(data.athlete       ?? '').trim(),
      team:         String(data.team          ?? '').trim(),
      grandparent:  String(data.grandparent   ?? '').trim(),
      trustedAdults:String(data.trustedAdults ?? '').trim(),
      babysitter:   String(data.babysitter    ?? '').trim(),
      hardThing:    String(data.hardThing     ?? '').trim(),
      flashPoint:   String(data.flashPoint    ?? '').trim(),
      siblings:     String(data.siblings      ?? '').trim(),
      track:        String(data.track         ?? 'elementary').trim(),
    })
  }

  // Converts from Prisma Child model to domain entity
  static fromPrisma(record: Record<string, unknown>): ChildProfile {
    return ChildProfile.create(record as Partial<ChildProfileData> & { id: string; familyId: string })
  }

  // Returns only the fields the DB schema accepts for create/update
  toCreateInput(): Omit<ChildProfileData, 'id'> {
    const { id, ...rest } = { id: this.id, ...this }
    return rest
  }
}
