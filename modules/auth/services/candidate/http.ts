import { API, getAccessToken } from "@/lib/api/config";

/* Internal transport helpers for candidate_api — not re-exported from the barrel. */

export async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");
  return fetch(`${API.CANDIDATE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

/** Multipart upload — omits Content-Type so the browser sets the boundary. */
export async function authedUpload(path: string, formData: FormData): Promise<Response> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");
  return fetch(`${API.CANDIDATE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `API error ${res.status}`);
  return json.data as T;
}
