import type { AdminDashboard, Catalogs, Evaluation, EvaluationFormData, User } from '../types/evaluation';

const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'formulario_academico_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? 'No fue posible completar la solicitud');
  }

  return data as T;
}

export async function loginWithGoogle(credential: string) {
  const session = await request<{ token: string; user: User }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
  tokenStore.set(session.token);
  return session;
}

export const getMe = () => request<{ user: User }>('/me');

export const getCatalogs = (filters: { program?: string; semester?: string } = {}) => {
  const params = new URLSearchParams();
  if (filters.program) params.set('program', filters.program);
  if (filters.semester) params.set('semester', filters.semester);
  const query = params.toString();

  return request<{ catalogs: Catalogs }>(`/catalogos${query ? `?${query}` : ''}`);
};

export const createEvaluation = (payload: EvaluationFormData) =>
  request<{ evaluation: Evaluation }>('/evaluaciones', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const checkEvaluationAvailability = (filters: {
  subject: string;
  professorName: string;
  classDate: string;
}) => {
  const params = new URLSearchParams({
    subject: filters.subject,
    professorName: filters.professorName,
    classDate: filters.classDate
  });

  return request<{ available: boolean; message: string | null }>(`/evaluaciones/availability?${params.toString()}`);
};

export const listEvaluations = () => request<{ evaluations: Evaluation[] }>('/evaluaciones');

export const getAdminDashboard = () => request<AdminDashboard>('/evaluaciones/admin/dashboard');
