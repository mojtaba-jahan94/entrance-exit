import type { IncomingMessage, ServerResponse } from 'http';

export function setCorsHeaders(res: ServerResponse, req?: IncomingMessage) {
  const allowedOriginEnv = process.env.ALLOWED_ORIGIN;
  let originToSet = '';

  const incomingOrigin = req?.headers?.origin;

  if (allowedOriginEnv && allowedOriginEnv.trim()) {
    const allowedList = allowedOriginEnv.split(',').map((o) => o.trim().toLowerCase());
    if (incomingOrigin && allowedList.includes(incomingOrigin.toLowerCase())) {
      originToSet = incomingOrigin;
    } else if (allowedList.length === 1 && allowedList[0] !== '*') {
      originToSet = allowedList[0];
    }
  } else {
    // Safe defaults for dev or Vercel
    if (process.env.NODE_ENV !== 'production') {
      if (incomingOrigin && (incomingOrigin.includes('localhost') || incomingOrigin.includes('127.0.0.1'))) {
        originToSet = incomingOrigin;
      } else {
        originToSet = 'http://localhost:5173';
      }
    } else if (process.env.VERCEL_URL) {
      originToSet = `https://${process.env.VERCEL_URL}`;
    }
  }

  if (originToSet) {
    res.setHeader('Access-Control-Allow-Origin', originToSet);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
}

export function sendJson(
  res: ServerResponse & {
    status?: (code: number) => { json: (data: unknown) => void };
    setHeader?: (name: string, value: string | number | readonly string[]) => any;
  },
  status: number,
  data: unknown,
  req?: IncomingMessage,
  headers?: Record<string, string | number>
) {
  setCorsHeaders(res, req);
  if (headers && typeof res.setHeader === 'function') {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, String(value));
    }
  }
  if (typeof res.status === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export async function parseRequestBody<T = Record<string, unknown>>(req: IncomingMessage & { body?: unknown }): Promise<T> {
  // If already parsed (e.g. by Vercel serverless environment)
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }

  // Parse stream body for dev server / custom runner
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? (JSON.parse(body) as T) : ({} as T));
      } catch {
        resolve({} as T);
      }
    });
    req.on('error', () => {
      resolve({} as T);
    });
  });
}
