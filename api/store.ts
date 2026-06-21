import type { Quarter, Application, Category } from '../shared/types.js';
import { STALL_CONFIG } from '../shared/types.js';

const quarters = new Map<string, Quarter>();
const applicationCounters = new Map<string, number>();
const ADMIN_PASSWORD = 'admin123';

function generateQuarterId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

function generateApplicationId(quarterId: string): string {
  const current = applicationCounters.get(quarterId) ?? 0;
  const next = current + 1;
  applicationCounters.set(quarterId, next);
  return `APP-${String(next).padStart(4, '0')}`;
}

function createMockApplications(): Application[] {
  const mockData: Array<{ vendorId: string; category: Category; originalStallNumber?: string; priorityRenewal: boolean; consecutiveMissedQuarters: number }> = [
    { vendorId: 'TZ001', category: 'vegetable', originalStallNumber: 'V001', priorityRenewal: true, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ002', category: 'vegetable', originalStallNumber: 'V002', priorityRenewal: true, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ003', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ004', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 1 },
    { vendorId: 'TZ005', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 2 },
    { vendorId: 'TZ006', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ007', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 3 },
    { vendorId: 'TZ008', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ009', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 1 },
    { vendorId: 'TZ010', category: 'vegetable', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ011', category: 'seafood', originalStallNumber: 'S001', priorityRenewal: true, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ012', category: 'seafood', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ013', category: 'seafood', priorityRenewal: false, consecutiveMissedQuarters: 2 },
    { vendorId: 'TZ014', category: 'seafood', priorityRenewal: false, consecutiveMissedQuarters: 1 },
    { vendorId: 'TZ015', category: 'seafood', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ016', category: 'seafood', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ017', category: 'seafood', priorityRenewal: false, consecutiveMissedQuarters: 4 },
    { vendorId: 'TZ018', category: 'deli', originalStallNumber: 'D001', priorityRenewal: true, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ019', category: 'deli', originalStallNumber: 'D002', priorityRenewal: true, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ020', category: 'deli', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ021', category: 'deli', priorityRenewal: false, consecutiveMissedQuarters: 1 },
    { vendorId: 'TZ022', category: 'deli', priorityRenewal: false, consecutiveMissedQuarters: 0 },
    { vendorId: 'TZ023', category: 'deli', priorityRenewal: false, consecutiveMissedQuarters: 2 },
  ];

  return mockData.map((d, i) => ({
    id: `APP-${String(i + 1).padStart(4, '0')}`,
    vendorId: d.vendorId,
    category: d.category,
    originalStallNumber: d.originalStallNumber,
    priorityRenewal: d.priorityRenewal,
    appliedAt: Date.now() - (mockData.length - i) * 60000,
    consecutiveMissedQuarters: d.consecutiveMissedQuarters,
    status: 'pending' as const,
  }));
}

function initDefaultQuarter(): Quarter {
  const id = generateQuarterId();
  const existing: Quarter = {
    id: '2026-Q1',
    name: '2026年第一季度',
    status: 'archived',
    categoryStalls: JSON.parse(JSON.stringify(STALL_CONFIG)),
    applications: [],
    archivedAt: Date.now() - 86400000 * 90,
  };
  quarters.set(existing.id, existing);
  applicationCounters.set(existing.id, 0);

  const mockApps = createMockApplications();
  const quarter: Quarter = {
    id,
    name: `${new Date().getFullYear()}年第${Math.floor(new Date().getMonth() / 3) + 1}季度`,
    status: 'collecting',
    categoryStalls: JSON.parse(JSON.stringify(STALL_CONFIG)),
    applications: mockApps,
  };
  quarters.set(quarter.id, quarter);
  applicationCounters.set(quarter.id, mockApps.length);
  return quarter;
}

initDefaultQuarter();

export const store = {
  getQuarters(): Quarter[] {
    return Array.from(quarters.values()).sort((a, b) => b.id.localeCompare(a.id));
  },

  getQuarter(id: string): Quarter | undefined {
    return quarters.get(id);
  },

  getActiveQuarter(): Quarter | undefined {
    const list = this.getQuarters();
    return list.find(q => q.status !== 'archived');
  },

  createQuarter(data: { name: string; lotteryDate?: string }): Quarter {
    const id = generateQuarterId() + '-' + Date.now();
    const quarter: Quarter = {
      id,
      name: data.name,
      status: 'collecting',
      lotteryDate: data.lotteryDate,
      categoryStalls: JSON.parse(JSON.stringify(STALL_CONFIG)),
      applications: [],
    };
    quarters.set(id, quarter);
    applicationCounters.set(id, 0);
    return quarter;
  },

  updateQuarter(id: string, data: Partial<Quarter>): Quarter | undefined {
    const q = quarters.get(id);
    if (!q) return undefined;
    if (q.status === 'archived') throw new Error('已归档季度不可修改');
    if (data.status && data.status === 'archived') throw new Error('不可直接设置为归档状态');
    if (data.status && q.status === 'published' && data.status !== 'published') throw new Error('已公示季度不可回退状态');
    const safeData: Partial<Quarter> = {};
    if (data.name !== undefined) safeData.name = data.name;
    if (data.lotteryDate !== undefined) safeData.lotteryDate = data.lotteryDate;
    if (data.status !== undefined && q.status === 'collecting' && data.status === 'collecting') safeData.status = data.status;
    const updated = { ...q, ...safeData };
    quarters.set(id, updated);
    return updated;
  },

  archiveQuarter(id: string): Quarter | undefined {
    const q = quarters.get(id);
    if (!q) return undefined;
    if (q.status !== 'published') throw new Error('仅已公示的季度可以归档');
    const archived: Quarter = { ...q, status: 'archived', archivedAt: Date.now() };
    quarters.set(id, archived);
    return archived;
  },

  addApplication(quarterId: string, data: Omit<Application, 'id' | 'appliedAt' | 'status' | 'consecutiveMissedQuarters'> & { consecutiveMissedQuarters?: number }): Application | undefined {
    const q = quarters.get(quarterId);
    if (!q) return undefined;
    if (q.status !== 'collecting') throw new Error('当前状态不可添加申请');
    const validCategories: Category[] = ['vegetable', 'seafood', 'deli'];
    if (!validCategories.includes(data.category)) throw new Error('非法品类');
    const exists = q.applications.some(a => a.vendorId === data.vendorId);
    if (exists) throw new Error('同一摊主不可重复申请同季度');
    const app: Application = {
      id: generateApplicationId(quarterId),
      vendorId: data.vendorId,
      category: data.category,
      originalStallNumber: data.originalStallNumber,
      priorityRenewal: data.priorityRenewal,
      appliedAt: Date.now(),
      consecutiveMissedQuarters: data.consecutiveMissedQuarters ?? 0,
      status: 'pending',
    };
    q.applications.push(app);
    return app;
  },

  updateApplication(quarterId: string, appId: string, data: Partial<Application>): Application | undefined {
    const q = quarters.get(quarterId);
    if (!q) return undefined;
    if (q.status === 'archived') throw new Error('已归档季度不可修改');
    if (q.status !== 'collecting') throw new Error('当前状态不可修改申请');
    const idx = q.applications.findIndex(a => a.id === appId);
    if (idx === -1) return undefined;
    if (data.category) {
      const validCategories: Category[] = ['vegetable', 'seafood', 'deli'];
      if (!validCategories.includes(data.category)) throw new Error('非法品类');
    }
    if (data.vendorId && data.vendorId !== q.applications[idx].vendorId) {
      const exists = q.applications.some(a => a.vendorId === data.vendorId);
      if (exists) throw new Error('同一摊主不可重复申请同季度');
    }
    q.applications[idx] = { ...q.applications[idx], ...data };
    return q.applications[idx];
  },

  deleteApplication(quarterId: string, appId: string): boolean {
    const q = quarters.get(quarterId);
    if (!q) return false;
    if (q.status !== 'collecting') throw new Error('当前状态不可删除申请');
    const len = q.applications.length;
    q.applications = q.applications.filter(a => a.id !== appId);
    return q.applications.length < len;
  },

  saveResults(quarterId: string, results: Quarter['results']): Quarter | undefined {
    const q = quarters.get(quarterId);
    if (!q) return undefined;
    if (q.status !== 'collecting') throw new Error('仅收集期季度可执行抽签');
    if (q.results) throw new Error('抽签已执行，不可重复执行');
    if (!q.lotteryDate) throw new Error('请先设定抽签日期');
    q.results = results;
    if (results) {
      const map = new Map<string, Application>();
      [...results.winning, ...results.waiting, ...results.failed].forEach(a => map.set(a.id, a));
      q.applications = q.applications.map(a => map.get(a.id) || a);
    }
    q.status = 'published';
    quarters.set(quarterId, q);
    return q;
  },

  verifyAdmin(password: string): boolean {
    return password === ADMIN_PASSWORD;
  },
};
