const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : '')).replace(/\/$/, '');

const getApiBaseUrl = () => {
  if (API_BASE_URL) return API_BASE_URL;
  throw new Error('The API is not configured. Set VITE_API_URL in the frontend Vercel project and redeploy.');
};

const handleUnauthorizedResponse = (response) => {
  if (response.status !== 401) return;
  sessionStorage.setItem('authNotice', 'Your session has expired or is no longer valid. Please sign in again.');
  window.dispatchEvent(new Event('auth-invalid'));
};

const fetchWithTimeout = async (url, { timeoutMs = 60000, ...options } = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`The server did not respond within ${Math.round(timeoutMs / 1000)} seconds. Check the API and compiler deployment.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetchWithTimeout(`${getApiBaseUrl()}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. proxy/server error page)
  }

  if (!response.ok || data?.success === false) {
    handleUnauthorizedResponse(response);
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.data = data?.data;
    throw error;
  }

  return data;
};

// Upload a File object from the user's device. Returns { fileUrl, originalName, mimeType, size }.
export const uploadFile = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  // No Content-Type header — the browser sets the multipart boundary itself
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok || data?.success === false) {
    handleUnauthorizedResponse(response);
    throw new Error(data?.error || `Upload failed (${response.status})`);
  }

  return data.data;
};

// Resolve a server-relative path like /uploads/xyz.pdf to a full URL
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Open a protected uploaded file without exposing the bearer token in a URL.
// External HTTPS evidence links are opened directly.
export const openAsset = async (path) => {
  if (!path) return;
  if (/^https:\/\//i.test(path)) {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }
  const token = localStorage.getItem('token');
  const response = await fetchWithTimeout(assetUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    handleUnauthorizedResponse(response);
    let message = `Unable to open file (${response.status})`;
    try { message = (await response.json())?.error || message; } catch { /* non-JSON response */ }
    throw new Error(message);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};

export default API_BASE_URL;
