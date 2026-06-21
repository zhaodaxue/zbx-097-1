import type { Quarter, Application, Category } from 'shared/types';
import { STALL_CONFIG, CATEGORY_LABELS } from 'shared/types';

export interface PrecheckItem {
  type: 'blocker' | 'warning';
  message: string;
  applicationIds: string[];
}

export interface PrecheckResult {
  blockers: PrecheckItem[];
  warnings: PrecheckItem[];
  hasBlocker: boolean;
  hasWarning: boolean;
  summary: {
    blockerCount: number;
    warningCount: number;
  };
}

function getStallCategory(stall: string): Category | null {
  if (stall.startsWith('V')) return 'vegetable';
  if (stall.startsWith('S')) return 'seafood';
  if (stall.startsWith('D')) return 'deli';
  return null;
}

export function runPrecheck(quarter: Quarter | null): PrecheckResult {
  const blockers: PrecheckItem[] = [];
  const warnings: PrecheckItem[] = [];

  if (!quarter) {
    blockers.push({
      type: 'blocker',
      message: '无活跃季度，请先创建季度',
      applicationIds: [],
    });
    return {
      blockers,
      warnings,
      hasBlocker: true,
      hasWarning: false,
      summary: { blockerCount: 1, warningCount: 0 },
    };
  }

  if (quarter.status !== 'collecting') {
    blockers.push({
      type: 'blocker',
      message: `当前季度状态为「${quarter.status}」，不在收集期`,
      applicationIds: [],
    });
  }

  if (quarter.applications.length === 0) {
    blockers.push({
      type: 'blocker',
      message: '暂无申请记录，请先录入摊主申请',
      applicationIds: [],
    });
  }

  const vendorMap = new Map<string, Application[]>();
  quarter.applications.forEach(app => {
    if (!vendorMap.has(app.vendorId)) {
      vendorMap.set(app.vendorId, []);
    }
    vendorMap.get(app.vendorId)!.push(app);
  });

  vendorMap.forEach((apps, vendorId) => {
    if (apps.length > 1) {
      blockers.push({
        type: 'blocker',
        message: `摊主 ${vendorId} 存在 ${apps.length} 条重复申请`,
        applicationIds: apps.map(a => a.id),
      });
    }
  });

  const invalidStallApps: Application[] = [];
  quarter.applications.forEach(app => {
    if (app.priorityRenewal && app.originalStallNumber) {
      const stallCat = getStallCategory(app.originalStallNumber);
      const validStalls = STALL_CONFIG[app.category];
      if (stallCat !== app.category || !validStalls.includes(app.originalStallNumber)) {
        invalidStallApps.push(app);
      }
    }
  });

  if (invalidStallApps.length > 0) {
    blockers.push({
      type: 'blocker',
      message: `${invalidStallApps.length} 条优先续摊申请的原摊位号不在对应品类配置内`,
      applicationIds: invalidStallApps.map(a => a.id),
    });
  }

  const stallOccupancy = new Map<string, Application[]>();
  quarter.applications.forEach(app => {
    if (app.priorityRenewal && app.originalStallNumber) {
      const stallCat = getStallCategory(app.originalStallNumber);
      const validStalls = STALL_CONFIG[app.category];
      if (stallCat === app.category && validStalls.includes(app.originalStallNumber)) {
        if (!stallOccupancy.has(app.originalStallNumber)) {
          stallOccupancy.set(app.originalStallNumber, []);
        }
        stallOccupancy.get(app.originalStallNumber)!.push(app);
      }
    }
  });

  stallOccupancy.forEach((apps, stall) => {
    if (apps.length > 1) {
      blockers.push({
        type: 'blocker',
        message: `原摊位号 ${stall} 被 ${apps.length} 个优先续摊申请占用`,
        applicationIds: apps.map(a => a.id),
      });
    }
  });

  (['vegetable', 'seafood', 'deli'] as Category[]).forEach(cat => {
    const catApps = quarter.applications.filter(a => a.category === cat);
    const stallCount = STALL_CONFIG[cat].length;
    if (catApps.length > stallCount) {
      warnings.push({
        type: 'warning',
        message: `${CATEGORY_LABELS[cat]}类申请 ${catApps.length} 人，超过摊位 ${stallCount} 个，将产生 ${catApps.length - stallCount} 名候补`,
        applicationIds: catApps.map(a => a.id),
      });
    }
  });

  return {
    blockers,
    warnings,
    hasBlocker: blockers.length > 0,
    hasWarning: warnings.length > 0,
    summary: {
      blockerCount: blockers.length,
      warningCount: warnings.length,
    },
  };
}
