// application/ports/IRateLimiter.ts

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export interface IRateLimiter {
  check(key: string): Promise<RateLimitResult>
}
