import type { Application, Quarter, Category } from 'shared/types';

const TOKEN_KEY = 'admin_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit & { requireAuth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => { headers[key] = value; });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => { headers[key] = value; });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  const token = getToken();
  if (token && options?.requireAuth !== false) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    clearToken();
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '请求失败');
  }
  return json.data as T;
}

export const api = {
  getToken,
  setToken,
  clearToken,

  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      requireAuth: false,
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
      requireAuth: true,
    }),

  getMe: () =>
    request<{ username: string }>('/api/auth/me', { requireAuth: true }),

  getQuarters: () => request<Array<Omit<Quarter, 'applications' | 'results' | 'categoryStalls'> & { applicationCount: number }>>('/api/quarters'),
  getActiveQuarter: () => request<Quarter | null>('/api/quarters/active'),
  getQuarter: (id: string) => request<Quarter>(`/api/quarters/${id}`),
  createQuarter: (data: { name: string; lotteryDate?: string }) =>
    request<Quarter>('/api/quarters', { method: 'POST', body: JSON.stringify(data), requireAuth: true }),
  updateQuarter: (id: string, data: Partial<Quarter>) =>
    request<Quarter>(`/api/quarters/${id}`, { method: 'PUT', body: JSON.stringify(data), requireAuth: true }),
  archiveQuarter: (id: string) =>
    request<Quarter>(`/api/quarters/${id}/archive`, { method: 'POST', requireAuth: true }),

  getApplications: (quarterId: string, category?: Category) =>
    request<Application[]>(`/api/quarters/${quarterId}/applications${category ? `?category=${category}` : ''}`),
  addApplication: (quarterId: string, data: { vendorId: string; category: Category; originalStallNumber?: string; priorityRenewal: boolean; consecutiveMissedQuarters?: number }) =>
    request<Application>(`/api/quarters/${quarterId}/applications`, { method: 'POST', body: JSON.stringify(data), requireAuth: true }),
  updateApplication: (quarterId: string, appId: string, data: Partial<Application>) =>
    request<Application>(`/api/quarters/${quarterId}/applications/${appId}`, { method: 'PUT', body: JSON.stringify(data), requireAuth: true }),
  deleteApplication: (quarterId: string, appId: string) =>
    request<{ success: boolean }>(`/api/quarters/${quarterId}/applications/${appId}`, { method: 'DELETE', requireAuth: true }),

  drawLottery: (quarterId: string) =>
    request<Quarter['results']>(`/api/quarters/${quarterId}/draw`, { method: 'POST', requireAuth: true }),
  getResults: (quarterId: string, category?: Category) =>
    request<Quarter['results']>(`/api/quarters/${quarterId}/results${category ? `?category=${category}` : ''}`),
  getExportUrl: (quarterId: string) => `/api/quarters/${quarterId}/export`,

  getVendorStatus: (vendorId: string) =>
    request<{ applications: Array<Application & { quarterId: string; quarterName: string; quarterStatus: Quarter['status'] }>; activeQuarter: { id: string; name: string; status: Quarter['status']; lotteryDate?: string } | null }>(`/api/vendor/${vendorId}`),
};
