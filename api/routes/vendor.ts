import { Router, type Request, type Response } from 'express';
import { store } from '../store.js';

const router = Router();

router.get('/:vendorId', (req: Request, res: Response): void => {
  try {
    const { vendorId } = req.params;
    const quarters = store.getQuarters();
    const applications: Array<Record<string, unknown>> = [];

    quarters.forEach(q => {
      const apps = q.applications.filter(a => a.vendorId === vendorId);
      apps.forEach(a => {
        applications.push({
          ...a,
          quarterId: q.id,
          quarterName: q.name,
          quarterStatus: q.status,
        });
      });
    });

    const active = store.getActiveQuarter();

    res.json({
      success: true,
      data: {
        applications,
        activeQuarter: active ? {
          id: active.id,
          name: active.name,
          status: active.status,
          lotteryDate: active.lotteryDate,
        } : null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
