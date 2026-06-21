import type { Application, Category, Quarter } from '../shared/types.js';

function weightedRandomPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function groupByCategory(applications: Application[]): Record<Category, Application[]> {
  return {
    vegetable: applications.filter(a => a.category === 'vegetable'),
    seafood: applications.filter(a => a.category === 'seafood'),
    deli: applications.filter(a => a.category === 'deli'),
  };
}

function getCategoryFromStall(stall: string): Category | null {
  if (stall.startsWith('V')) return 'vegetable';
  if (stall.startsWith('S')) return 'seafood';
  if (stall.startsWith('D')) return 'deli';
  return null;
}

export interface DrawResult {
  winning: Application[];
  waiting: Application[];
  failed: Application[];
}

export function executeLottery(quarter: Quarter): DrawResult {
  const allStalls = quarter.categoryStalls;
  const grouped = groupByCategory(quarter.applications);
  const winning: Application[] = [];
  const waiting: Application[] = [];
  const failed: Application[] = [];

  (['vegetable', 'seafood', 'deli'] as Category[]).forEach(category => {
    const apps = [...grouped[category]];
    const stalls = [...allStalls[category]];
    const availableStalls = new Set(stalls);
    const categoryWinning: Application[] = [];

    const priorityApps = apps.filter(a =>
      a.priorityRenewal &&
      a.originalStallNumber &&
      availableStalls.has(a.originalStallNumber) &&
      getCategoryFromStall(a.originalStallNumber) === category
    );

    priorityApps.forEach(app => {
      if (app.originalStallNumber && availableStalls.has(app.originalStallNumber)) {
        const winApp: Application = {
          ...app,
          status: 'winning',
          assignedStall: app.originalStallNumber,
        };
        categoryWinning.push(winApp);
        availableStalls.delete(app.originalStallNumber);
      }
    });

    const remainingApps = apps.filter(a =>
      !categoryWinning.find(w => w.id === a.id)
    );

    const remainingStalls = Array.from(availableStalls);
    remainingApps.sort((a, b) => a.appliedAt - b.appliedAt);

    const pool = [...remainingApps];
    while (remainingStalls.length > 0 && pool.length > 0) {
      const weights = pool.map(a => 1 + a.consecutiveMissedQuarters * 0.5);
      const picked = weightedRandomPick(pool, weights);
      const stallIdx = Math.floor(Math.random() * remainingStalls.length);
      const stall = remainingStalls.splice(stallIdx, 1)[0];
      const winApp: Application = {
        ...picked,
        status: 'winning',
        assignedStall: stall,
      };
      categoryWinning.push(winApp);
      const idx = pool.findIndex(p => p.id === picked.id);
      if (idx !== -1) pool.splice(idx, 1);
    }

    winning.push(...categoryWinning);

    const notWon = apps.filter(a => !categoryWinning.find(w => w.id === a.id));
    notWon.sort((a, b) => a.appliedAt - b.appliedAt);

    const waitCount = Math.min(3, notWon.length);
    for (let i = 0; i < waitCount; i++) {
      waiting.push({
        ...notWon[i],
        status: 'waiting',
        waitingRank: i + 1,
      });
    }
    for (let i = waitCount; i < notWon.length; i++) {
      failed.push({
        ...notWon[i],
        status: 'failed',
      });
    }
  });

  const sortByStall = (a: Application, b: Application) =>
    (a.assignedStall || '').localeCompare(b.assignedStall || '');

  return {
    winning: winning.sort(sortByStall),
    waiting: waiting.sort((a, b) => (a.waitingRank ?? 0) - (b.waitingRank ?? 0)),
    failed: failed.sort((a, b) => a.vendorId.localeCompare(b.vendorId)),
  };
}

export function exportToCsv(quarter: Quarter): string {
  const header = ['申请ID', '摊主ID', '经营品类', '原摊位号', '是否优先续摊', '申请时间', '连续未中签季数', '抽签状态', '分配摊位号', '候补排名'];
  const rows: string[][] = [];
  const all = quarter.results
    ? [...quarter.results.winning, ...quarter.results.waiting, ...quarter.results.failed]
    : quarter.applications;

  const catLabel: Record<Category, string> = { vegetable: '蔬果', seafood: '水产', deli: '熟食' };
  const statusLabel: Record<string, string> = { pending: '待抽签', winning: '已中签', waiting: '候补', failed: '未中签' };

  all.forEach(a => {
    rows.push([
      a.id,
      a.vendorId,
      catLabel[a.category],
      a.originalStallNumber || '',
      a.priorityRenewal ? '是' : '否',
      new Date(a.appliedAt).toLocaleString('zh-CN'),
      String(a.consecutiveMissedQuarters),
      statusLabel[a.status] || a.status,
      a.assignedStall || '',
      a.waitingRank ? String(a.waitingRank) : '',
    ]);
  });

  return [header, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
