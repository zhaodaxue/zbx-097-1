import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Calendar, Eye, Lock, CheckCircle2, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { QUARTER_STATUS_LABELS } from 'shared/types';

export default function ArchivePage() {
  const navigate = useNavigate();
  const { quarters, fetchQuarters, fetchActiveQuarter } = useAppStore();

  useEffect(() => {
    fetchQuarters();
    fetchActiveQuarter();
  }, [fetchQuarters, fetchActiveQuarter]);

  async function handleArchive(id: string, name: string) {
    if (!confirm(`确认归档「${name}」？归档后数据将永久只读，不可修改。`)) return;
    try {
      await api.archiveQuarter(id);
      await fetchQuarters();
      await fetchActiveQuarter();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">归档管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理历史季度，归档后数据不可修改</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {quarters.map(q => (
          <div key={q.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  q.status === 'archived' ? 'bg-gray-100' :
                  q.status === 'published' ? 'bg-green-100' :
                  'bg-primary-100'
                }`}>
                  {q.status === 'archived' ? (
                    <Lock className="w-5 h-5 text-gray-500" />
                  ) : q.status === 'published' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900">{q.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`badge ${
                      q.status === 'archived' ? 'bg-gray-100 text-gray-600' :
                      q.status === 'published' ? 'bg-green-100 text-green-700' :
                      q.status === 'collecting' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {QUARTER_STATUS_LABELS[q.status]}
                    </span>
                    <span className="text-xs text-gray-400">申请数 {q.applicationCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              {q.archivedAt
                ? `归档时间：${new Date(q.archivedAt).toLocaleString('zh-CN')}`
                : q.lotteryDate
                ? `抽签日期：${new Date(q.lotteryDate).toLocaleDateString('zh-CN')}`
                : '未设定抽签日期'}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/admin/results?quarter=${q.id}`)}
                className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                查看结果
              </button>
              {q.status === 'published' && (
                <button
                  onClick={() => handleArchive(q.id, q.name)}
                  className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
                >
                  <Archive className="w-4 h-4" />
                  归档
                </button>
              )}
            </div>

            {q.status === 'archived' && (
              <div className="mt-3 p-2.5 rounded-lg bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                已归档数据只读，不可修改
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
