import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, XCircle, Store, RefreshCw, ArrowLeft, MonitorPlay } from 'lucide-react';
import { api } from '@/lib/api';
import type { Application, Quarter } from 'shared/types';
import { CATEGORY_LABELS } from 'shared/types';

export default function PublicDisplay() {
  const navigate = useNavigate();
  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  async function refresh() {
    try {
      const q = await api.getActiveQuarter();
      setQuarter(q);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);

  const results = quarter?.results;
  const winning = results?.winning || [];
  const waiting = results?.waiting || [];
  const failed = results?.failed || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 text-white">
      <header className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">农贸市场摊位抽签公示</h1>
            <p className="text-white/60 text-sm">
              {quarter?.name || '加载中...'}
              {quarter && (
                <span className="ml-3 text-primary-300">
                  {lastUpdate.toLocaleTimeString('zh-CN')} 更新
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="手动刷新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>
      </header>

      <main className="p-8">
        {!results ? (
          <div className="flex flex-col items-center justify-center py-32">
            <MonitorPlay className="w-20 h-20 text-white/20 mb-6" />
            <h2 className="font-display text-3xl font-bold text-white/60 mb-2">抽签进行中</h2>
            <p className="text-white/40">结果将在抽签完成后自动展示，请稍候...</p>
            {loading && <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full w-1/3 bg-primary-500 animate-pulse" /></div>}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            <ResultPanel
              title="🎉 中签名单"
              subtitle={`共 ${winning.length} 人`}
              color="green"
              items={winning}
              renderItem={a => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-lg">{a.vendorId}</p>
                    <p className="text-xs opacity-70">{CATEGORY_LABELS[a.category]}</p>
                  </div>
                  <span className="font-mono font-black text-2xl text-green-300 bg-green-500/20 px-4 py-1.5 rounded-lg">
                    {a.assignedStall}
                  </span>
                </div>
              )}
            />
            <ResultPanel
              title="⏳ 候补队列"
              subtitle={`共 ${waiting.length} 人`}
              color="yellow"
              items={waiting}
              renderItem={a => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-lg">{a.vendorId}</p>
                    <p className="text-xs opacity-70">{CATEGORY_LABELS[a.category]}</p>
                  </div>
                  <span className="font-mono font-black text-2xl text-yellow-300 bg-yellow-500/20 px-4 py-1.5 rounded-lg">
                    #{a.waitingRank}
                  </span>
                </div>
              )}
            />
            <ResultPanel
              title="❌ 未中签"
              subtitle={`共 ${failed.length} 人`}
              color="red"
              items={failed}
              renderItem={a => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-lg">{a.vendorId}</p>
                    <p className="text-xs opacity-70">{CATEGORY_LABELS[a.category]}</p>
                  </div>
                  <span className="text-sm text-red-300/80">遗憾未中</span>
                </div>
              )}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function ResultPanel({
  title, subtitle, color, items, renderItem,
}: {
  title: string;
  subtitle: string;
  color: 'green' | 'yellow' | 'red';
  items: Application[];
  renderItem: (a: Application) => React.ReactNode;
}) {
  const colors = {
    green: { border: 'border-green-500/30', bg: 'bg-green-500/10', title: 'text-green-300' },
    yellow: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', title: 'text-yellow-300' },
    red: { border: 'border-red-500/30', bg: 'bg-red-500/10', title: 'text-red-300' },
  }[color];

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} flex flex-col overflow-hidden`}>
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className={`font-display text-2xl font-bold ${colors.title}`}>{title}</h2>
        <p className="text-white/60 text-sm mt-0.5">{subtitle}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-white/30 py-16">暂无数据</p>
        ) : (
          items.map((a, i) => (
            <div
              key={a.id}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {renderItem(a)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
