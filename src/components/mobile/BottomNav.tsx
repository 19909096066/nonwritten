import { Home, Scan, History, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDevice } from '@/hooks/useDevice';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDevice();

  // 桌面端不显示
  if (!isMobile) {
    return null;
  }

  const navItems: NavItem[] = [
    { icon: Home, label: '首页', path: '/mobile' },
    { icon: Scan, label: '扫码', path: '/mobile/scan' },
    { icon: History, label: '记录', path: '/mobile/records' },
    { icon: User, label: '我的', path: '/mobile/profile' },
  ];

  const handleNavigate = async (path: string) => {
    // 触觉反馈
    if (await Haptics.impact({ style: ImpactStyle.Light })) {
      console.log('Haptic feedback triggered');
    }

    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="flex flex-col items-center justify-center p-2 min-w-[64px] transition-colors duration-200"
              aria-label={item.label}
            >
              <div
                className={`transition-colors duration-200 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon size={24} strokeWidth={2} />
              </div>
              <span
                className={`text-xs mt-1 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
