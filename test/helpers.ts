/**
 * E2E helpers. Tests run against the already-running application (Docker dev
 * stack) over HTTP using the native `fetch` (Node 18+), so no extra HTTP client
 * dependency is required. Override the target with E2E_BASE_URL if needed.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
export const API = `${BASE}/api`;

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export interface RequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
}

/** Thin fetch wrapper that always parses the JSON envelope when present. */
export async function api<T = any>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body };
}

export interface LoginResult {
  accessToken: string;
  user: { id: number; email: string; role: { value: string } };
}

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<{ data: LoginResult }>> {
  return api('/auth/login', { method: 'POST', body: { email, password } });
}

/** Seeded ADMIN credentials (see seeds.md). */
export async function adminLogin(): Promise<LoginResult> {
  const res = await login('admin@aivacol.com', '123456');
  return res.body.data;
}

/** Seeded OPERATOR credentials (see seeds.md). */
export async function operatorLogin(): Promise<LoginResult> {
  const res = await login('operador@aivacol.com', '123456');
  return res.body.data;
}

/** Run-unique identifier suffix to keep tests re-runnable. */
function suffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Unique name with a recognizable test prefix (TEST_BRAND_, TEST_MODEL_, ...). */
export const uniqueName = (prefix: string): string => `${prefix}${suffix()}`;

/** Unique license plate, kept within the 20-char column limit. */
export const uniquePlate = (): string =>
  `TP${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

/** Unique numeric string (chassis/renavam) of the given length. */
export const uniqueDigits = (len = 11): string =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
