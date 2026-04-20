import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import StockListPage from './pages/stock/StockListPage';
import StockInPage from './pages/stock/StockInPage';
import StockOutPage from './pages/stock/StockOutPage';
import StockSplitPage from './pages/stock/StockSplitPage';

import PurchaseSuggestionPage from './pages/stock/PurchaseSuggestionPage';
import PendingInboundPage from './pages/stock/PendingInboundPage';
import UsersPage from './pages/UsersPage';
import QcStandardPage from './pages/qc/QcStandardPage';
import QcPurchasePage from './pages/qc/QcPurchasePage';
import QcProductionPage from './pages/qc/QcProductionPage';
import QcDefectPage from './pages/qc/QcDefectPage';
import LogsPage from './pages/LogsPage';
import ReportCenterPage from './pages/report/ReportCenterPage';
import WeChatBotPage from './pages/WeChatBotPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <DashboardPage />,
  },
  {
    name: '登录',
    path: '/login',
    element: <LoginPage />,
    visible: false,
  },
  {
    name: '库存明细',
    path: '/stock/list',
    element: <StockListPage />,
  },
  {
    name: '入库明细',
    path: '/stock/in',
    element: <StockInPage />,
  },
  {
    name: '出库明细',
    path: '/stock/out',
    element: <StockOutPage />,
  },
  {
    name: '拆包明细',
    path: '/stock/split',
    element: <StockSplitPage />,
  },

  {
    name: '采购建议',
    path: '/stock/purchase-suggestion',
    element: <PurchaseSuggestionPage />,
  },
  {
    name: '待入库明细',
    path: '/stock/pending-inbound',
    element: <PendingInboundPage />,
  },
  {
    name: '用户管理',
    path: '/users',
    element: <UsersPage />,
  },
  {
    name: '质检标准',
    path: '/qc/standard',
    element: <QcStandardPage />,
  },
  {
    name: '采购质检',
    path: '/qc/purchase',
    element: <QcPurchasePage />,
  },
  {
    name: '生产质检',
    path: '/qc/production',
    element: <QcProductionPage />,
  },
  {
    name: '次品明细',
    path: '/qc/defect',
    element: <QcDefectPage />,
  },
  {
    name: '操作日志',
    path: '/logs',
    element: <LogsPage />,
  },
  {
    name: '企业微信机器人',
    path: '/wechat-bot',
    element: <WeChatBotPage />,
  },
  {
    name: '报表中心',
    path: '/report',
    element: <ReportCenterPage />,
  },
];

export default routes;
