import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserSearch, MonitorPlay, Store } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const cards = [
    {
      to: '/admin',
      icon: ShieldCheck,
      title: '管理端',
      desc: '录入申请、执行抽签、公示结果、归档管理',
      color: 'from-primary-600 to-primary-800',
      bg: 'hover:bg-primary-50 border-primary-200',
    },
    {
      to: '/vendor',
      icon: UserSearch,
      title: '摊主查询',
      desc: '输入摊主ID查看申请状态与中签结果',
      color: 'from-accent-500 to-accent-700',
      bg: 'hover:bg-accent-50 border-accent-200',
    },
    {
      to: '/public-display',
      icon: MonitorPlay,
      title: '公示大屏',
      desc: '实时展示中签、候补、未中签名单',
      color: 'from-gray-700 to-gray-900',
      bg: 'hover:bg-gray-50 border-gray-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-market-bg to-accent-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-xl shadow-primary-200">
              <Store className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            农贸市场摊位抽签公示系统
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            公平、公正、公开的摊位季度轮转抽签管理平台
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {cards.map((card, i) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={`group text-left card border-2 ${card.bg} animate-slide-up transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-1.5">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-16 card animate-slide-up" style={{ animationDelay: '320ms' }}>
          <h3 className="font-display text-lg font-bold text-gray-900 mb-3">抽签规则说明</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="text-primary-600 font-bold">1.</span>
              品类分为「蔬果」「水产」「熟食」三类，每类有固定摊位数
            </li>
            <li className="flex gap-2">
              <span className="text-primary-600 font-bold">2.</span>
              「优先续摊」且原摊位品类不变者，直接占用原摊位号，不参与随机
            </li>
            <li className="flex gap-2">
              <span className="text-primary-600 font-bold">3.</span>
              剩余摊位按权重随机分配，权重 = 1 + 连续未中签季数 × 0.5
            </li>
            <li className="flex gap-2">
              <span className="text-primary-600 font-bold">4.</span>
              超额申请未中签者按申请时间先后进入「候补队列」
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} 农贸市场管委会 · 摊位抽签公示系统
        </p>
      </div>
    </div>
  );
}
