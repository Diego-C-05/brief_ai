const BASE = import.meta.env.VITE_API_URL as string;

// Salva il token dopo login o registrazione
const saveToken = (token: string) =>
  localStorage.setItem('briefai_token', token);

// Restituisce l'header Authorization da aggiungere a ogni richiesta protetta
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('briefai_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Decodifica il payload JWT senza librerie esterne
export const decodeToken = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

// POST /api/auth/login
export const login = async (email: string, password: string) => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  saveToken(data.token);
  return data;
};

// POST /api/auth/register
export const register = async (payload: {
  email: string;
  password: string;
  username: string;
  preferences?: {
    macroTopics?: string[] | undefined;
    keywords?: string[] | undefined;
  } | undefined;
}) => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  saveToken(data.token);
  return data;
};

// GET /api/auth/me — verifica se il token è ancora valido
export const getMe = async () => {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    localStorage.removeItem('briefai_token');
    return null;
  }
  return res.json();
};

// Logout locale
// export const logout = () =>
//   localStorage.removeItem('briefai_token');
