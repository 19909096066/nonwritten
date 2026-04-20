import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { useDevice } from '@/hooks/useDevice';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
  rightAction?: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({
  children,
  title = '',
  showBack = false,
  showMenu = false,
  showProfile = false,
  rightAction,
  hideNav = false,
}: MobileLayoutProps) => {
  const { isMobile } = useDevice();

  // 桌面端直接返回内容
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* 头部 */}
      {title && (
        <MobileHeader
          title={title}
          showBack={showBack}
          showMenu={showMenu}
          showProfile={showProfile}
          rightAction={rightAction}
        />
      )}

      {/* 内容区域 */}
      <main
        className={`pt-safe ${
          !hideNav ? 'pb-[60px] pb-safe' : ''
        }`}
      >
        {children}
      </main>

      {/* 底部导航 */}
      {!hideNav && <BottomNav />}
    </div>
  );
};
