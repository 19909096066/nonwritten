import { ChevronLeft, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/hooks/useDevice';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
}

export const MobileHeader = ({
  title,
  showBack = false,
  showMenu = false,
  showProfile = false,
  rightAction,
}: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { isMobile, platform } = useDevice();
  const { user } = useAuth();

  // 桌面端不显示
  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleMenu = () => {
    // TODO: 打开侧边菜单
    console.log('Open menu');
  };

  const handleProfile = () => {
    navigate('/mobile/profile');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 pt-safe">
      <div className="flex items-center justify-between px-4 py-3 h-14">
        {/* 左侧：返回按钮或菜单 */}
        <div className="flex items-center w-10">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="返回"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
          )}
          {showMenu && (
            <button
              onClick={handleMenu}
              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="菜单"
            >
              <Menu size={24} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* 中间：标题 */}
        <h1 className="text-base font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center justify-end w-10 gap-2">
          {rightAction}
          {showProfile && (
            <button
              onClick={handleProfile}
              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="个人中心"
            >
              <User size={24} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
