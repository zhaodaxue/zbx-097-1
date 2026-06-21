import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Calendar, AlertCircle, Clock, CheckCircle2, Info } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { QUARTER_STATUS_LABELS } from 'shared/types';

export default function Lottery() {
  const navigate = useNavigate();
  const { activeQuarter, fetchActiveQuarter } = useAppStore();
  const [lotteryDate, setLotteryDate] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchActiveQuarter();
  }, [fetchActiveQuarter]);

  useEffect(() => {
    if (activeQuarter?.lotteryDate) {
      const d = new Date(activeQuarter.lotteryDate);
      setLotteryDate(d.toISOString().slice(0, 16));
    }
  }, [activeQuarter?.id, activeQuarter?.lotteryDate]);

  const q = activeQuarter;
  const canDraw = q && q.status === 'collecting' && q.applications.length > 0;
  const canSetDate = q && (q.status === 'collecting' || q.status === 'ready');

  async function handleSaveDate() {
    if (!q || !lotteryDate) return;
    try {
      await api.updateQuarter(q.id, { lotteryDate: new Date(lotteryDate).toISOString() });
      await fetchActiveQuarter();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDraw() {
    if (!q) return;
    if (!confirm('确认开启抽签？抽签完成后将自动公示，结果不可修改。')) return;

    setDrawing(true);
    setError(null);
    setProgress(0);

    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 8, 90));
    }, 150);

    try {
      await new Promise(r => setTimeout(r, 1500));
      await api.drawLottery(q.id);
      setProgress(100);
      await fetchActiveQuarter();
      setTimeout(() => navigate('/admin/results'), 500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      clearInterval(timer);
      setDrawing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">抽签管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          设定抽签日期并执行抽签操作
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="font-display text-lg font-bold text-gray-900">抽签日期设置</h2>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="label-field">抽签日期时间</label>
            <input
              type="datetime-local"
              value={lotteryDate}
              onChange={e => setLotteryDate(e.target.value)}
              disabled={!canSetDate}
              className="input-field"
            />
          </div>
          <button
            onClick={handleSaveDate}
            disabled={!canSetDate || !lotteryDate}
            className="btn-secondary"
          >
            保存日期
          </button>
        </div>
        {q?.lotteryDate && (
          <p className="text-sm text-gray-500 mt-3">
            当前设定：{new Date(q.lotteryDate).toLocaleString('zh-CN')}
          </p>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shuffle className="w-5 h-5 text-accent-500" />
          <h2 className="font-display text-lg font-bold text-gray-900">执行抽签</h2>
        </div>

        {q?.status === 'archived' && (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-gray-400" />
            <span>本季度已归档，抽签结果已固化</span>
          </div>
        )}

        {q?.status === 'published' && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium">抽签已完成并公示</p>
              <button
                onClick={() => navigate('/admin/results')}
                className="text-sm underline mt-1 hover:text-green-800"
              >
                查看抽签结果 →
              </button>
            </div>
          </div>
        )}

        {(q?.status === 'collecting' || q?.status === 'ready') && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="申请总数" value={q?.applications.length || 0} />
              <Stat label="蔬果类" value={q?.applications.filter(a => a.category === 'vegetable').length || 0} color="text-green-600" />
              <Stat label="水产类" value={q?.applications.filter(a => a.category === 'seafood').length || 0} color="text-cyan-600" />
              <Stat label="熟食类" value={q?.applications.filter(a => a.category === 'deli').length || 0} color="text-orange-600" />
            </div>

            {drawing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-6">
                  <Shuffle className="w-6 h-6 text-accent-500 animate-spin-slow" />
                  <p className="font-medium text-gray-700">正在执行抽签算法，请稍候...</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleDraw}
                disabled={!canDraw}
                className="w-full btn-accent py-4 text-lg flex items-center justify-center gap-3"
              >
                <Shuffle className="w-6 h-6" />
                开启抽签
              </button>
            )}

            {!canDraw && q && q.applications.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>当前暂无申请，请先录入摊主申请后再执行抽签</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="card bg-gradient-to-br from-primary-50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-primary-600" />
          <h3 className="font-display font-bold text-gray-900">抽签规则</h3>
        </div>
        <ol className="space-y-2.5 text-sm text-gray-700">
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <span><strong>品类分区：</strong>蔬果、水产、熟食三类摊位独立抽签</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <span><strong>优先续摊：</strong>勾选「优先续摊」且原摊位品类不变者，直接占用原摊位号</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">3</span>
            <span><strong>加权随机：</strong>权重 = 1 + 连续未中签季数 × 0.5，连续未中签者概率更高</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">4</span>
            <span><strong>候补队列：</strong>未中签者按申请时间先后进入候补，每品类最多3名候补</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-center">
      <p className={`text-2xl font-bold font-display ${color || 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
