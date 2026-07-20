import 'server-only';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;

const defaults = {
  'login':         { max: 20, window: ONE_MINUTE },
  'signup':        { max: 10, window: ONE_MINUTE },
  'inquiry':       { max: 20, window: ONE_MINUTE },
  'inspection':    { max: 10, window: ONE_MINUTE },
  'car-listing':   { max: 10, window: ONE_MINUTE },
  'upload':        { max: 20, window: ONE_MINUTE },
  'api':           { max: 120, window: ONE_MINUTE },
  'status-check':  { max: 20, window: ONE_MINUTE },
} as const;

type Action = keyof typeof defaults;

function getClientId(): string {
  return 'global';
}

export function rateLimit(action: Action, clientId?: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
} {
  const envFlag = process.env.ENABLE_RATE_LIMIT;
  if (envFlag === 'false' || (envFlag !== 'true' && process.env.NODE_ENV !== 'production')) {
    return { allowed: true, remaining: 999, resetIn: 0, limit: 999 };
  }

  const key = `${clientId ?? getClientId()}:${action}`;
  const config = defaults[action];
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + config.window };
    store.set(key, entry);
  }

  entry.count++;
  const allowed = entry.count <= config.max;
  const remaining = Math.max(0, config.max - entry.count);
  const resetIn = entry.resetAt - now;

  return { allowed, remaining, resetIn, limit: config.max };
}

export function rateLimitHeaders(action: Action, clientId?: string): Record<string, string> {
  const result = rateLimit(action, clientId);
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / ONE_SECOND)),
    'Cache-Control': 'private, max-age=0, must-revalidate',
  };
}

export function clearRateLimitStore(): void {
  store.clear();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 60 * ONE_SECOND);
