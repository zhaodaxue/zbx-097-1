import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, AlertTriangle, XCircle, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { runPrecheck, type PrecheckItem } from '@/lib/precheck';
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
  const [showPrecheck, setShowPrecheck] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

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
  const precheck = runPrecheck(q);

  const apps = q?.applications.filter(a => {
    const matchSearch = !search || a.vendorId.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || a.category === filterCategory;
    return matchSearch && matchCat;
  }) || [];

  function scrollAndHighlight(appId: string) {
    const row = rowRefs.current.get(appId);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(appId);
      setTimeout(() => setHighlightedId(null), 3000);
    }
  }

  function handlePrecheckItemClick(item: PrecheckItem) {
    if (item.applicationIds.length > 0) {
      setSearch('');
      setFilterCategory('all');
      setTimeout(() => scrollAndHighlight(item.applicationIds[0]), 50);
    }
  }

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
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowPrecheck(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            预检
            {precheck.summary.blockerCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                {precheck.summary.blockerCount}
              </span>
            )}
            {precheck.summary.warningCount > 0 && precheck.summary.blockerCount === 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                {precheck.summary.warningCount}
              </span>
            )}
          </button>
          <button
            onClick={openAdd}
            disabled={!isEditable}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增申请
          </button>
        </div>
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
                <tr
                  key={a.id}
                  ref={el => { if (el) rowRefs.current.set(a.id, el); }}
                  className={`transition-colors duration-300 ${
                    highlightedId === a.id
                      ? 'bg-yellow-100 ring-2 ring-yellow-400'
                      : 'hover:bg-gray-50'
                  }`}
                >
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

      {showPrecheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                录入预检
              </h3>
              <button
                onClick={() => setShowPrecheck(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {!precheck.hasBlocker && !precheck.hasWarning && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-700">预检通过</p>
                  <p className="text-sm text-gray-500 mt-1">当前录入数据无异常，可以执行抽签</p>
                </div>
              )}

              {precheck.blockers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4" />
                    阻塞项 ({precheck.blockers.length})
                  </h4>
                  <div className="space-y-2">
                    {precheck.blockers.map((item, i) => (
                      <button
                        key={`b-${i}`}
                        onClick={() => handlePrecheckItemClick(item)}
                        disabled={item.applicationIds.length === 0}
                        className={`w-full text-left p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors ${
                          item.applicationIds.length === 0 ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <p className="text-sm text-red-700 font-medium">{item.message}</p>
                        {item.applicationIds.length > 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            关联申请 ID：{item.applicationIds.join(', ')} · 点击定位
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {precheck.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4" />
                    警告项 ({precheck.warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {precheck.warnings.map((item, i) => (
                      <button
                        key={`w-${i}`}
                        onClick={() => handlePrecheckItemClick(item)}
                        className="w-full text-left p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-yellow-700 font-medium">{item.message}</p>
                        {item.applicationIds.length > 0 && (
                          <p className="text-xs text-yellow-600 mt-1">
                            关联申请 ID：{item.applicationIds.join(', ')} · 点击定位
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {precheck.hasBlocker ? (
                    <span className="text-red-600 font-medium">存在阻塞项，请先修复后再执行抽签</span>
                  ) : precheck.hasWarning ? (
                    <span className="text-yellow-600">存在警告项，抽签将产生候补队列</span>
                  ) : (
                    <span className="text-green-600">预检通过，可正常执行抽签</span>
                  )}
                </div>
                <button
                  onClick={() => setShowPrecheck(false)}
                  className="btn-primary px-6"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
