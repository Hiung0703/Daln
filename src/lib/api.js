const API_URL = 'http://localhost:4000/api';

// Helpers that manage token in localStorage
const TOKEN_KEY = 'auth_token';
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// API calls with auth
async function callApi(endpoint, options = {}) {
  const token = getToken();
  const opts = {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  try {
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  } catch (err) {
    console.error('API call failed:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please ensure the server is running.');
    }
    throw err;
  }
}

// Auth endpoints
export async function register(username, password) {
  const data = await callApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function login(username, password) {
  const data = await callApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data.user;
}

// History endpoints
export async function getHistory() {
  return await callApi('/history');
}

export async function addHistory(content, meta = null) {
  return await callApi('/history', {
    method: 'POST',
    body: JSON.stringify({ content, meta }),
  });
}

export async function updateHistory(id, content, meta = null) {
  return await callApi(`/history/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ content, meta }),
  });
}

export async function deleteHistory(id) {
  return await callApi(`/history/${id}`, {
    method: 'DELETE',
  });
}

export function logout() {
  clearToken();
}

// Upload image to model via backend. Expects a File object. Returns parsed JSON from model.
export async function scanImage(file) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file, file.name);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_URL}/scan`, {
    method: 'POST',
    body: form,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scan failed');
  
  // Parse model response: extract cheque_details array from nested structure
  // Expected format: { success: true, data: { gt_parse: { cheque_details: [...] } } }
  if (data.success && data.data?.gt_parse?.cheque_details) {
    // Convert array of {key: value} objects to single flat object
    const details = data.data.gt_parse.cheque_details;
    const flatData = {};
    details.forEach(item => {
      const key = Object.keys(item)[0];
      flatData[key] = item[key];
    });
    return flatData;
  }
  
  // Fallback: return raw data if format doesn't match
  return data.data || data;
}