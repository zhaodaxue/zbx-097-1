import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import type { Application, Category } from 'shared/types';
import { CATEGORY_LABELS, STATUS_LABELS } from 'shared/types';

export default function Applications() {
  const { activeQuarter, fetchActiveQuarter } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    vendorId: '',
    category: 'vegetable' as Category,
    originalStallNumber: '',
    priorityRenewal: false,
    consecutiveMissedQuarters: 0,
  });

  useEffect(() => {
    fetchActiveQuarter();
  }, [fetchActiveQuarter]);

  const q = activeQuarter;
  const isEditable = q?.status === 'collecting';

  const apps = q?.applications.filter(a => {
    const matchSearch = !search || a.vendorId.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || a.category === filterCategory;
    return matchSearch && matchCat;
  }) || [];

  function resetForm() {
    setForm({ vendorId: '', category: 'vegetable', originalStallNumber: '', priorityRenewal: false, consecutiveMissedQuarters: 0 });
    setEditing(null);
  }

  function openAdd() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(app: Application) {
    setEditing(app);
    setForm({
      vendorId: app.vendorId,
      category: app.category,
      originalStallNumber: app.originalStallNumber || '',
      priorityRenewal: app.priorityRenewal,
      consecutiveMissedQuarters: app.consecutiveMissedQuarters,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      if (editing) {
        await api.updateApplication(q.id, editing.id, form);
      } else {
        await api.addApplication(q.id, form);
      }
      await fetchActiveQuarter();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(app: Application) {
    if (!q || !confirm(`确认删除摊主 ${app.vendorId} 的申请？`)) return;
    try {
      await api.deleteApplication(q.id, app.id);
      await fetchActiveQuarter();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">申请管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {apps.length} 条申请记录</p>
        </div>
        <button
          onClick={openAdd}
          disabled={!isEditable}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增申请
        </button>
      </div>

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

        {!isEditable && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
            当前状态为「{q?.status}」，申请已锁定，不可编辑
          </div>
        )}

        <div className="overflow-x-auto -mx-6 -mt-2">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">申请ID</th>
                <th className="table-th">摊主ID</th>
                <th className="table-th">经营品类</th>
                <th className="table-th">原摊位号</th>
                <th className="table-th">优先续摊</th>
                <th className="table-th">连续未中签</th>
                <th className="table-th">申请状态</th>
                <th className="table-th">分配摊位</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-mono text-xs text-gray-500">{a.id}</td>
                  <td className="table-td font-semibold">{a.vendorId}</td>
                  <td className="table-td">{CATEGORY_LABELS[a.category]}</td>
                  <td className="table-td font-mono">{a.originalStallNumber || '-'}</td>
                  <td className="table-td">
                    {a.priorityRenewal ? (
                      <span className="badge bg-primary-100 text-primary-700">是</span>
                    ) : (
                      <span className="text-gray-400">否</span>
                    )}
                  </td>
                  <td className="table-td">{a.consecutiveMissedQuarters} 季</td>
                  <td className="table-td">
                    <span className={`badge ${
                      a.status === 'winning' ? 'bg-green-100 text-green-700' :
                      a.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                      a.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="table-td font-mono font-semibold text-primary-700">
                    {a.assignedStall || (a.waitingRank ? `候补 #${a.waitingRank}` : '-')}
                  </td>
                  <td className="table-td text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => openEdit(a)}
                        disabled={!isEditable}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={!isEditable}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={9} className="table-td text-center text-gray-400 py-8">
                    暂无申请记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-display text-lg font-bold text-gray-900">
                {editing ? '编辑申请' : '新增申请'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label-field">摊主ID *</label>
                <input
                  type="text"
                  required
                  value={form.vendorId}
                  onChange={e => setForm({ ...form, vendorId: e.target.value })}
                  className="input-field"
                  placeholder="如 TZ001"
                />
              </div>
              <div>
                <label className="label-field">经营品类 *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as Category })}
                  className="select-field"
                >
                  <option value="vegetable">蔬果</option>
                  <option value="seafood">水产</option>
                  <option value="deli">熟食</option>
                </select>
              </div>
              <div>
                <label className="label-field">原摊位号</label>
                <input
                  type="text"
                  value={form.originalStallNumber}
                  onChange={e => setForm({ ...form, originalStallNumber: e.target.value })}
                  className="input-field"
                  placeholder="如 V001，可为空"
                />
              </div>
              <div>
                <label className="label-field">连续未中签季数</label>
                <input
                  type="number"
                  min={0}
                  value={form.consecutiveMissedQuarters}
                  onChange={e => setForm({ ...form, consecutiveMissedQuarters: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.priorityRenewal}
                  onChange={e => setForm({ ...form, priorityRenewal: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-600"
                />
                <span className="text-sm text-gray-700">优先续摊</span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
