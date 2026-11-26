const BASE_URL = import.meta.env.VITE_GATEWAY_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${BASE_URL}${path}`
  if (!query) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => undefined)
  }
  const text = await res.text()
  return text.length ? text : undefined
}

function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.length) return body
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const key of ['message', 'title', 'detail', 'error']) {
      const value = record[key]
      if (typeof value === 'string' && value.length) return value
    }
    
    const errors = record.errors
    if (errors && typeof errors === 'object') {
      const messages = Object.values(errors as Record<string, unknown>)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
      if (messages.length) return [...new Set(messages)].join(' ')
    }
  }
  return fallback
}

export interface RequestOptions {
  query?: QueryParams
  
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { query, body, signal } = options

  const init: RequestInit = {
    method,
    credentials: 'include', 
    headers: {},
    signal,
  }

  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), init)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, 'Nie można połączyć się z serwerem.')
  }

  const parsed = await parseBody(res)

  if (!res.ok) {
    
    throw new ApiError(
      res.status,
      extractMessage(parsed, `Błąd ${res.status}.`),
      parsed,
    )
  }

  return parsed as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) =>
    request<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions) =>
    request<T>('PUT', path, options),
  patch: <T>(path: string, options?: RequestOptions) =>
    request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
}
