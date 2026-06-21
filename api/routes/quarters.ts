import { Router, type Request, type Response } from 'express';
import { store } from '../store.js';
import { executeLottery, exportToCsv } from '../lottery.js';
import type { Category } from '../../shared/types.js';
import { requireAuth } from './auth.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const quarters = store.getQuarters().map(q => ({
      id: q.id,
      name: q.name,
      status: q.status,
      lotteryDate: q.lotteryDate,
      applicationCount: q.applications.length,
      archivedAt: q.archivedAt,
    }));
    res.json({ success: true, data: quarters });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/active', (req: Request, res: Response): void => {
  try {
    const q = store.getActiveQuarter();
    if (!q) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: q });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const q = store.getQuarter(req.params.id);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    res.json({ success: true, data: q });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.post('/', requireAuth, (req: Request, res: Response): void => {
  try {
    const { name, lotteryDate } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: '季度名称必填' });
      return;
    }
    const q = store.createQuarter({ name, lotteryDate });
    res.json({ success: true, data: q });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.put('/:id', requireAuth, (req: Request, res: Response): void => {
  try {
    const q = store.updateQuarter(req.params.id, req.body);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    res.json({ success: true, data: q });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.post('/:id/archive', requireAuth, (req: Request, res: Response): void => {
  try {
    const q = store.archiveQuarter(req.params.id);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    res.json({ success: true, data: q });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.get('/:id/applications', (req: Request, res: Response): void => {
  try {
    const q = store.getQuarter(req.params.id);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    const { category } = req.query;
    let apps = q.applications;
    if (category) {
      apps = apps.filter(a => a.category === category);
    }
    res.json({ success: true, data: apps });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.post('/:id/applications', requireAuth, (req: Request, res: Response): void => {
  try {
    const { vendorId, category, originalStallNumber, priorityRenewal, consecutiveMissedQuarters } = req.body;
    if (!vendorId || !category) {
      res.status(400).json({ success: false, error: '摊主ID和品类必填' });
      return;
    }
    const app = store.addApplication(req.params.id, {
      vendorId,
      category: category as Category,
      originalStallNumber,
      priorityRenewal: !!priorityRenewal,
      consecutiveMissedQuarters: consecutiveMissedQuarters ?? 0,
    });
    if (!app) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    res.json({ success: true, data: app });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.put('/:id/applications/:appId', requireAuth, (req: Request, res: Response): void => {
  try {
    const app = store.updateApplication(req.params.id, req.params.appId, req.body);
    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' });
      return;
    }
    res.json({ success: true, data: app });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.delete('/:id/applications/:appId', requireAuth, (req: Request, res: Response): void => {
  try {
    const ok = store.deleteApplication(req.params.id, req.params.appId);
    if (!ok) {
      res.status(404).json({ success: false, error: '申请不存在' });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.post('/:id/draw', requireAuth, (req: Request, res: Response): void => {
  try {
    const q = store.getQuarter(req.params.id);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    if (q.status === 'archived') {
      res.status(400).json({ success: false, error: '已归档季度不可抽签' });
      return;
    }
    if (q.applications.length === 0) {
      res.status(400).json({ success: false, error: '暂无申请，无法抽签' });
      return;
    }
    const results = executeLottery(q);
    const updated = store.saveResults(q.id, results);
    res.json({ success: true, data: updated?.results });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/:id/results', (req: Request, res: Response): void => {
  try {
    const q = store.getQuarter(req.params.id);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    const { category } = req.query;
    let results = q.results;
    if (results && category) {
      results = {
        winning: results.winning.filter(a => a.category === category),
        waiting: results.waiting.filter(a => a.category === category),
        failed: results.failed.filter(a => a.category === category),
      };
    }
    res.json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/:id/export', (req: Request, res: Response): void => {
  try {
    const q = store.getQuarter(req.params.id);
    if (!q) {
      res.status(404).json({ success: false, error: '季度不存在' });
      return;
    }
    const csv = exportToCsv(q);
    const safeName = encodeURIComponent(`${q.name}-抽签结果.csv`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeName}`);
    res.send('\uFEFF' + csv);
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
