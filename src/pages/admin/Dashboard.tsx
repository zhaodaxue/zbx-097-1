import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Shuffle,
  Trophy,
  ArrowRight,
  Sprout,
  Fish,
  UtensilsCrossed,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { runPrecheck } from '@/lib/precheck';
import { CATEGORY_LABELS, STALL_CONFIG, QUARTER_STATUS_LABELS } from 'shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeQuarter, fetchActiveQuarter } = useAppStore();

  useEffect(() => {
    fetchActiveQuarter();
  }, [fetchActiveQuarter]);

  const q = activeQuarter;
  const totalApps = q?.applications.length || 0;
  const catCounts = {
    vegetable: q?.applications.filter(a => a.category === 'vegetable').length || 0,
    seafood: q?.applications.filter(a => a.category === 'seafood').length || 0,
    deli: q?.applications.filter(a => a.category === 'deli').length || 0,
  };

  const precheck = runPrecheck(q);
  const { blockerCount, warningCount } = precheck.summary;

  const statCards = [
    { label: '申请总数', value: totalApps, icon: Users, color: 'from-blue-500 to-blue-700' },
    { label: '蔬果类摊位', value: `${catCounts.vegetable}/${STALL_CONFIG.vegetable.length}`, icon: Sprout, color: 'from-green-500 to-green-700' },
    { label: '水产类摊位', value: `${catCounts.seafood}/${STALL_CONFIG.seafood.length}`, icon: Fish, color: 'from-cyan-500 to-cyan-700' },
    { label: '熟食类摊位', value: `${catCounts.deli}/${STALL_CONFIG.deli.length}`, icon: UtensilsCrossed, color: 'from-orange-500 to-orange-700' },
  ];

  const actions = [
    { to: '/admin/applications', label: '录入摊主申请', icon: FileText, primary: true, disabled: false },
    { to: '/admin/lottery', label: '执行抽签', icon: Shuffle, primary: true, disabled: precheck.hasBlocker },
    { to: '/admin/results', label: '查看公示结果', icon: Trophy, primary: false, disabled: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">管理概览</h1>
            <p className="text-sm text-gray-500 mt-1">
              {q?.name || '加载中...'}
              {q && (
                <span className="ml-2 badge bg-primary-100 text-primary-700">
                  {QUARTER_STATUS_LABELS[q.status]}
                </span>
              )}
            </p>
          </div>
          {q?.lotteryDate && (
            <div className="text-sm text-gray-600">
              抽签日期：<span className="font-semibold text-primary-700">{new Date(q.lotteryDate).toLocaleDateString('zh-CN')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-display">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">录入预检</h2>
        {blockerCount === 0 && warningCount === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700">预检通过</p>
              <p className="text-sm text-green-600">当前录入数据无异常，可以执行抽签</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-lg border ${
              blockerCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <XCircle className={`w-6 h-6 flex-shrink-0 ${blockerCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-2xl font-bold font-display ${blockerCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {blockerCount}
                  </p>
                  <p className={`text-sm ${blockerCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>阻塞项</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${
              warningCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-6 h-6 flex-shrink-0 ${warningCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-2xl font-bold font-display ${warningCount > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                    {warningCount}
                  </p>
                  <p className={`text-sm ${warningCount > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>警告项</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/admin/applications')}
          className="mt-4 w-full btn-secondary"
        >
          前往申请管理查看详情 →
        </button>
      </div>

      <div className="card">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {actions.map(act => (
            <button
              key={act.to}
              onClick={() => !act.disabled && navigate(act.to)}
              disabled={act.disabled}
              title={act.disabled && blockerCount > 0 ? `存在 ${blockerCount} 项阻塞，请先修复` : undefined}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                act.disabled
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : act.primary
                    ? 'bg-primary-700 text-white border-primary-700 hover:bg-primary-600 hover:shadow-card-hover cursor-pointer'
                    : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <act.icon className="w-5 h-5" />
                <div className="text-left">
                  <span className="font-medium block">{act.label}</span>
                  {act.disabled && blockerCount > 0 && (
                    <span className="text-xs text-gray-400 mt-0.5 block">
                      存在 {blockerCount} 项阻塞
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 ${act.disabled ? 'opacity-30' : 'opacity-70'}`} />
            </button>
          ))}
        </div>
      </div>

      {q?.results && (
        <div className="card">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">抽签结果统计</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
              <p className="text-3xl font-bold text-green-700 font-display">{q.results.winning.length}</p>
              <p className="text-sm text-green-600 mt-1">中签</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
              <p className="text-3xl font-bold text-yellow-700 font-display">{q.results.waiting.length}</p>
              <p className="text-sm text-yellow-600 mt-1">候补</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-3xl font-bold text-red-700 font-display">{q.results.failed.length}</p>
              <p className="text-sm text-red-600 mt-1">未中签</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">品类摊位配置</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(['vegetable', 'seafood', 'deli'] as const).map(cat => (
            <div key={cat} className="p-4 rounded-lg bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-2">{CATEGORY_LABELS[cat]}</p>
              <div className="flex flex-wrap gap-1.5">
                {STALL_CONFIG[cat].map(s => (
                  <span key={s} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
