import { useEffect, useState } from 'react';
import { Download, Filter, Trophy, Clock, XCircle, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import type { Application, Category } from 'shared/types';
import { CATEGORY_LABELS, STATUS_LABELS } from 'shared/types';

export default function Results() {
  const { activeQuarter, fetchActiveQuarter } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchActiveQuarter();
  }, [fetchActiveQuarter]);

  const q = activeQuarter;
  const results = q?.results;

  function filter(list: Application[]) {
    return list.filter(a => {
      const matchCat = filterCategory === 'all' || a.category === filterCategory;
      const matchSearch = !search || a.vendorId.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  const winning = results ? filter(results.winning) : [];
  const waiting = results ? filter(results.waiting) : [];
  const failed = results ? filter(results.failed) : [];

  function handleExport() {
    if (!q) return;
    window.open(api.getExportUrl(q.id), '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">公示结果</h1>
          <p className="text-sm text-gray-500 mt-1">
            {q?.name} · {results ? `中签 ${results.winning.length} / 候补 ${results.waiting.length} / 未中签 ${results.failed.length}` : '暂无结果'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!results}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出 CSV
        </button>
      </div>

      {results && (
        <div className="card">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索摊主ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as Category | 'all')}
                className="select-field w-36"
              >
                <option value="all">全部品类</option>
                <option value="vegetable">蔬果</option>
                <option value="seafood">水产</option>
                <option value="deli">熟食</option>
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <ResultColumn
              title="中签名单"
              icon={Trophy}
              count={winning.length}
              color="green"
              items={winning}
              renderItem={a => (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{a.vendorId}</span>
                    <span className="text-xs text-gray-400 ml-2">{CATEGORY_LABELS[a.category]}</span>
                  </div>
                  <span className="font-mono font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded">
                    {a.assignedStall}
                  </span>
                </div>
              )}
            />

            <ResultColumn
              title="候补队列"
              icon={Clock}
              count={waiting.length}
              color="yellow"
              items={waiting}
              renderItem={a => (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{a.vendorId}</span>
                    <span className="text-xs text-gray-400 ml-2">{CATEGORY_LABELS[a.category]}</span>
                  </div>
                  <span className="font-mono font-bold text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded">
                    候补 #{a.waitingRank}
                  </span>
                </div>
              )}
            />

            <ResultColumn
              title="未中签"
              icon={XCircle}
              count={failed.length}
              color="red"
              items={failed}
              renderItem={a => (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{a.vendorId}</span>
                    <span className="text-xs text-gray-400 ml-2">{CATEGORY_LABELS[a.category]}</span>
                  </div>
                  <span className="text-xs text-red-500">未中签</span>
                </div>
              )}
            />
          </div>
        </div>
      )}

      {!results && (
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500">抽签尚未执行，暂无公示结果</p>
          <p className="text-sm text-gray-400 mt-1">请前往「抽签管理」执行抽签</p>
        </div>
      )}
    </div>
  );
}

function ResultColumn({
  title, icon: Icon, count, color, items, renderItem,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: 'green' | 'yellow' | 'red';
  items: Application[];
  renderItem: (a: Application) => React.ReactNode;
}) {
  const colors = {
    green: { header: 'bg-green-600', badge: 'bg-green-100 text-green-700', border: 'border-green-200' },
    yellow: { header: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
    red: { header: 'bg-red-600', badge: 'bg-red-100 text-red-700', border: 'border-red-200' },
  }[color];

  return (
    <div className={`rounded-xl border ${colors.border} overflow-hidden bg-white`}>
      <div className={`${colors.header} px-5 py-3.5 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="font-semibold">{title}</span>
        </div>
        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-bold">{count}</span>
      </div>
      <div className="p-3 max-h-[500px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map(a => (
              <li key={a.id} className={`px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors animate-fade-in`}>
                {renderItem(a)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
