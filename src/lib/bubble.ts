// ─────────────────────────────────────────────────────────────
// Bubble External API Client
//
// All calls go directly to Bubble's Data API and Workflow API.
// No Next.js API routes involved — purely client-side.
//
// Bubble API docs:
//   Data API:     GET/POST/PATCH  /api/1.1/obj/<type>
//   Workflow API: POST            /api/1.1/wf/<workflow-name>
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BUBBLE_BASE_URL as string;
// App-level API token — used only for unauthenticated calls (signup)
const APP_TOKEN = process.env.NEXT_PUBLIC_BUBBLE_API_TOKEN as string;

// ── Core fetch wrapper ────────────────────────────────────────
async function bubbleFetch(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<any> {
  const authToken = token ?? APP_TOKEN;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
  });

  // 🔥 ALWAYS try JSON first (Bubble returns JSON even on errors)
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw {
      statusCode: res.status,
      message: data?.message || data?.error || "Bubble request failed",
      reason: data?.reason,
      raw: data,
    };
  }

  return data;
}

// ── Public helpers ────────────────────────────────────────────

/** GET  /api/1.1/obj/<type>  or  /api/1.1/obj/<type>/<id> */
export async function bubbleGet(
  path: string,
  params?: Record<string, string | number | boolean>,
  token?: string,
) {
  const url = params
    ? `${path}?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ),
      )}`
    : path;
  return bubbleFetch(url, { method: "GET" }, token);
}

/** POST  /api/1.1/obj/<type>  or  /api/1.1/wf/<name> */
export async function bubblePost(
  path: string,
  body: Record<string, unknown>,
  token?: string,
) {
  return bubbleFetch(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token,
  );
}

/** PATCH  /api/1.1/obj/<type>/<id> */
export async function bubblePatch(
  path: string,
  body: Record<string, unknown>,
  token?: string,
) {
  return bubbleFetch(
    path,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    token,
  );
}

/** DELETE  /api/1.1/obj/<type>/<id> */
export async function bubbleDelete(path: string, token?: string) {
  return bubbleFetch(path, { method: "DELETE" }, token);
}
