import { NextRequest, NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  reset: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000  // 1 minute
const MAX_REQUESTS = 10   // per IP per window

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS })
    return NextResponse.next()
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000)
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  entry.count++
  return NextResponse.next()
}

export const config = {
  matcher: "/api/chat",
}
