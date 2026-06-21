import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Shuffle,
  Trophy,
  Archive,
  Store,
  MonitorPlay,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { QUARTER_STATUS_LABELS } from 'shared/types';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeQuarter, fetchActiveQuarter, adminUsername, logout } = useAppStore();

  useEffect(() => {
    fetchActiveQuarter();
  }, [fetchActiveQuarter]);

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: '概览' },
    { to: '/admin/applications', icon: FileText, label: '申请管理' },
    { to: '/admin/lottery', icon: Shuffle, label: '抽签管理' },
    { to: '/admin/results', icon: Trophy, label: '公示结果' },
    { to: '/admin/archive', icon: Archive, label: '归档管理' },
  ];

  return (
    <div className="flex h-screen bg-market-bg overflow-hidden">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-gray-900">农贸市场</h1>
              <p className="text-xs text-gray-500">摊位抽签管理系统</p>
            </div>
          </div>
        </div>

        {activeQuarter && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
            <p className="text-xs text-primary-700 font-medium">当前季度</p>
            <p className="font-display text-sm font-bold text-primary-800 mt-0.5">{activeQuarter.name}</p>
            <span className="badge bg-primary-700 text-white mt-1.5">
              {QUARTER_STATUS_LABELS[activeQuarter.status]}
            </span>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="my-3 border-t border-gray-100" />

          <button
            onClick={() => navigate('/public-display')}
            className="nav-item w-full text-left"
          >
            <MonitorPlay className="w-4.5 h-4.5" />
            <span>公示大屏</span>
          </button>
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{adminUsername || '管理员'}</p>
              <p className="text-xs text-gray-400">系统管理员</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
