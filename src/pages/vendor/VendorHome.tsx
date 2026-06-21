import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSearch, ArrowLeft, Store, Search } from 'lucide-react';

export default function VendorHome() {
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId.trim()) return;
    navigate(`/vendor/result?id=${encodeURIComponent(vendorId.trim())}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-market-bg to-primary-50">
      <div className="max-w-lg mx-auto px-6 py-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-xl shadow-accent-200 mb-5">
            <UserSearch className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">摊主查询</h1>
          <p className="text-gray-500">输入摊主ID查询申请状态与中签结果</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 animate-slide-up">
          <div>
            <label className="label-field">摊主ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                placeholder="请输入摊主ID，如 TZ001"
                className="input-field pl-9"
                autoFocus
              />
            </div>
          </div>

          <button type="submit" disabled={!vendorId.trim()} className="btn-accent w-full">
            查询结果
          </button>

          <p className="text-xs text-gray-400 text-center pt-2">
            示例：TZ001 ~ TZ023 均可查询（Mock 数据）
          </p>
        </form>

        <div className="mt-8 card">
          <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-primary-600" />
            抽签规则说明
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="text-primary-600 font-bold">·</span>品类分为「蔬果」「水产」「熟食」三类</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">·</span>优先续摊且品类不变者直接保留原摊位</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">·</span>剩余摊位按权重随机分配</li>
            <li className="flex gap-2"><span className="text-primary-600 font-bold">·</span>连续未中签者权重更高</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
