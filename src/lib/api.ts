import type { Application, Quarter, Category } from 'shared/types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '请求失败');
  }
  return json.data as T;
}

export const api = {
  getQuarters: () => request<Array<Omit<Quarter, 'applications' | 'results' | 'categoryStalls'> & { applicationCount: number }>>('/api/quarters'),
  getActiveQuarter: () => request<Quarter>('/api/quarters/active'),
  getQuarter: (id: string) => request<Quarter>(`/api/quarters/${id}`),
  createQuarter: (data: { name: string; lotteryDate?: string }) =>
    request<Quarter>('/api/quarters', { method: 'POST', body: JSON.stringify(data) }),
  updateQuarter: (id: string, data: Partial<Quarter>) =>
    request<Quarter>(`/api/quarters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveQuarter: (id: string) =>
    request<Quarter>(`/api/quarters/${id}/archive`, { method: 'POST' }),

  getApplications: (quarterId: string, category?: Category) =>
    request<Application[]>(`/api/quarters/${quarterId}/applications${category ? `?category=${category}` : ''}`),
  addApplication: (quarterId: string, data: { vendorId: string; category: Category; originalStallNumber?: string; priorityRenewal: boolean; consecutiveMissedQuarters?: number }) =>
    request<Application>(`/api/quarters/${quarterId}/applications`, { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (quarterId: string, appId: string, data: Partial<Application>) =>
    request<Application>(`/api/quarters/${quarterId}/applications/${appId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApplication: (quarterId: string, appId: string) =>
    request<{ success: boolean }>(`/api/quarters/${quarterId}/applications/${appId}`, { method: 'DELETE' }),

  drawLottery: (quarterId: string) =>
    request<Quarter['results']>(`/api/quarters/${quarterId}/draw`, { method: 'POST' }),
  getResults: (quarterId: string, category?: Category) =>
    request<Quarter['results']>(`/api/quarters/${quarterId}/results${category ? `?category=${category}` : ''}`),
  getExportUrl: (quarterId: string) => `/api/quarters/${quarterId}/export`,

  getVendorStatus: (vendorId: string) =>
    request<{ applications: Array<Application & { quarterId: string; quarterName: string; quarterStatus: Quarter['status'] }>; activeQuarter: { id: string; name: string; status: Quarter['status']; lotteryDate?: string } | null }>(`/api/vendor/${vendorId}`),
};
