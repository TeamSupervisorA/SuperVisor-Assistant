const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

const getApiBaseUrl = () => {
  if (API_BASE_URL) return API_BASE_URL;
  throw new Error('The API is not configured. Set VITE_API_URL in the frontend Vercel project and redeploy.');
};

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. proxy/server error page)
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
};

// Upload a File object from the user's device. Returns { fileUrl, originalName, mimeType, size }.
export const uploadFile = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  // No Content-Type header — the browser sets the multipart boundary itself
  const response = await fetch(`${getApiBaseUrl()}/api/upload`, {
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

export default API_BASE_URL;
