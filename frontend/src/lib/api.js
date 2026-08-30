export const getToken = () => localStorage.getItem('saregama_token');
export const setToken = (token) => localStorage.setItem('saregama_token', token);
export const removeToken = () => localStorage.removeItem('saregama_token');

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'API Request failed');
  }

  return response.json();
}
