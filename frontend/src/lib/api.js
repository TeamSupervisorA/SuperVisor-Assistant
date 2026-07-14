const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

export default API_BASE_URL;
