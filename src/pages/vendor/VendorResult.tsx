import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserSearch, Trophy, Clock, XCircle, HelpCircle, Store, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import type { Application, Quarter } from 'shared/types';
import { CATEGORY_LABELS, STATUS_LABELS, QUARTER_STATUS_LABELS } from 'shared/types';

type VendorApp = Application & { quarterId: string; quarterName: string; quarterStatus: Quarter['status'] };

export default function VendorResult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const vendorId = params.get('id') || '';
  const [data, setData] = useState<{ applications: VendorApp[]; activeQuarter: { id: string; name: string; status: Quarter['status']; lotteryDate?: string } | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    api.getVendorStatus(vendorId)
      .then(d => setData(d))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const statusIcon = (s: Application['status']) => {
    switch (s) {
      case 'winning': return { icon: Trophy, color: 'text-green-600', bg: 'bg-green-100' };
      case 'waiting': return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'failed': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default: return { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-market-bg to-primary-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/vendor')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回查询
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-xl shadow-accent-200 mb-4">
            <UserSearch className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">摊主查询结果</h1>
          <p className="text-gray-500 mt-1">摊主ID：<span className="font-mono font-semibold text-primary-700">{vendorId}</span></p>
        </div>

        {loading && (
          <div className="card text-center py-10 text-gray-500">查询中...</div>
        )}

        {error && (
          <div className="card text-center py-10 text-red-600">{error}</div>
        )}

        {!loading && !error && data && (
          <div className="space-y-4 animate-fade-in">
            {data.activeQuarter && (
              <div className="card p-4 bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold text-gray-700">当前季度</span>
                </div>
                <p className="font-display text-lg font-bold text-gray-900">{data.activeQuarter.name}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`badge ${
                    data.activeQuarter.status === 'published' ? 'bg-green-100 text-green-700' :
                    data.activeQuarter.status === 'archived' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {QUARTER_STATUS_LABELS[data.activeQuarter.status]}
                  </span>
                  {data.activeQuarter.lotteryDate && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      抽签日：{new Date(data.activeQuarter.lotteryDate).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {data.applications.length === 0 && (
              <div className="card text-center py-10">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">未找到该摊主的申请记录</p>
              </div>
            )}

            {data.applications.map(app => {
              const s = statusIcon(app.status);
              const Icon = s.icon;
              return (
                <div key={`${app.quarterId}-${app.id}`} className="card">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <h3 className="font-display font-bold text-gray-900">{app.quarterName}</h3>
                        <span className={`badge ${s.bg} ${s.color} font-medium`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mt-2">
                        <div>
                          <span className="text-gray-500">经营品类：</span>
                          <span className="text-gray-800">{CATEGORY_LABELS[app.category]}</span>
                        </div>
                        {app.originalStallNumber && (
                          <div>
                            <span className="text-gray-500">原摊位：</span>
                            <span className="text-gray-800 font-mono">{app.originalStallNumber}</span>
                          </div>
                        )}
                        {app.assignedStall && (
                          <div className="col-span-2">
                            <span className="text-gray-500">分配摊位：</span>
                            <span className="font-mono font-bold text-green-700 text-base">{app.assignedStall}</span>
                          </div>
                        )}
                        {app.waitingRank && (
                          <div className="col-span-2">
                            <span className="text-gray-500">候补排名：</span>
                            <span className="font-bold text-yellow-700">第 {app.waitingRank} 位</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">连续未中签：</span>
                          <span className="text-gray-800">{app.consecutiveMissedQuarters} 季</span>
                        </div>
                        <div>
                          <span className="text-gray-500">优先续摊：</span>
                          <span className="text-gray-800">{app.priorityRenewal ? '是' : '否'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
