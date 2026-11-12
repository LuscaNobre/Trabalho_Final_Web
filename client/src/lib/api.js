const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('street095_token');
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (_error) {
    throw new Error('Não foi possível conectar à API. Confira se o servidor está rodando.');
  }
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (response.status === 401 && token && !path.startsWith('/auth/login')) {
    localStorage.removeItem('street095_token');
    window.dispatchEvent(new Event('street095:session-expired'));
  }
  if (!response.ok) {
    const detail = Array.isArray(data.errors) ? data.errors.map((item) => (typeof item === 'string' ? item : item.message)).filter(Boolean)[0] : '';
    const error = new Error(detail || data.message || 'Não foi possível concluir esta ação.');
    error.status = response.status;
    error.details = data.errors;
    throw error;
  }
  return data;
}

export const toQuery = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();
export const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatDate = (value, options = { dateStyle: 'medium', timeStyle: 'short' }) => new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'America/Boa_Vista' }).format(new Date(value));
