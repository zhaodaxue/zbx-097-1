export type Category = 'vegetable' | 'seafood' | 'deli';

export const CATEGORY_LABELS: Record<Category, string> = {
  vegetable: '蔬果',
  seafood: '水产',
  deli: '熟食',
};

export type ApplicationStatus = 'pending' | 'winning' | 'waiting' | 'failed';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '待抽签',
  winning: '已中签',
  waiting: '候补',
  failed: '未中签',
};

export type QuarterStatus = 'collecting' | 'ready' | 'drawing' | 'published' | 'archived';

export const QUARTER_STATUS_LABELS: Record<QuarterStatus, string> = {
  collecting: '收集中',
  ready: '准备抽签',
  drawing: '抽签中',
  published: '已公示',
  archived: '已归档',
};

export interface Application {
  id: string;
  vendorId: string;
  category: Category;
  originalStallNumber?: string;
  priorityRenewal: boolean;
  appliedAt: number;
  consecutiveMissedQuarters: number;
  status: ApplicationStatus;
  assignedStall?: string;
  waitingRank?: number;
}

export interface Quarter {
  id: string;
  name: string;
  status: QuarterStatus;
  lotteryDate?: string;
  categoryStalls: Record<Category, string[]>;
  applications: Application[];
  results?: {
    winning: Application[];
    waiting: Application[];
    failed: Application[];
  };
  archivedAt?: number;
}

export const STALL_CONFIG: Record<Category, string[]> = {
  vegetable: ['V001', 'V002', 'V003', 'V004', 'V005', 'V006', 'V007', 'V008'],
  seafood: ['S001', 'S002', 'S003', 'S004', 'S005'],
  deli: ['D001', 'D002', 'D003', 'D004'],
};
