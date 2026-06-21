import { Router, type Request, type Response } from 'express';
import { store } from '../store.js';

const router = Router();

const ADMIN_USERNAME = 'admin';

interface AdminSession {
  token: string;
  username: string;
  createdAt: number;
}

const sessions = new Map<string, AdminSession>();

function generateToken(): string {
  return 'tk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export function requireAuth(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录，请先登录' });
    return;
  }
  const token = authHeader.slice(7);
  const session = sessions.get(token);
  if (!session) {
    res.status(401).json({ success: false, error: '登录已过期，请重新登录' });
    return;
  }
  next();
}

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码必填' });
      return;
    }
    if (username !== ADMIN_USERNAME || !store.verifyAdmin(password)) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }
    const token = generateToken();
    const session: AdminSession = {
      token,
      username,
      createdAt: Date.now(),
    };
    sessions.set(token, session);
    res.json({
      success: true,
      data: {
        token,
        username,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.post('/logout', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      sessions.delete(token);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/me', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未登录' });
      return;
    }
    const token = authHeader.slice(7);
    const session = sessions.get(token);
    if (!session) {
      res.status(401).json({ success: false, error: '登录已过期' });
      return;
    }
    res.json({
      success: true,
      data: {
        username: session.username,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
