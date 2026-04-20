import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import StockListPage from './pages/stock/StockListPage';
import StockInPage from './pages/stock/StockInPage';
import StockOutPage from './pages/stock/StockOutPage';
import BatchImportPage from './pages/stock/BatchImportPage';
import UsersPage from './pages/UsersPage';
import QcStandardPage from './pages/qc/QcStandardPage';
import QcPurchasePage from './pages/qc/QcPurchasePage';
import QcProductionPage from './pages/qc/QcProductionPage';
import QcDefectPage from './pages/qc/QcDefectPage';
import LogsPage from './pages/LogsPage';
import MobileHomePage from './pages/mobile/MobileHomePage';
import ScanInPage from './pages/mobile/ScanInPage';
import ScanOutPage from './pages/mobile/ScanOutPage';
import ManualQueryPage from './pages/mobile/ManualQueryPage';
import RecordsPage from './pages/mobile/RecordsPage';
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
    name: '批量入库',
    path: '/stock/batch-import',
    element: <BatchImportPage />,
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
  // 移动端路由
  {
    name: '移动端首页',
    path: '/mobile',
    element: <MobileHomePage />,
    visible: false,
  },
  {
    name: '扫码入库',
    path: '/mobile/scan-in',
    element: <ScanInPage />,
    visible: false,
  },
  {
    name: '扫码出库',
    path: '/mobile/scan-out',
    element: <ScanOutPage />,
    visible: false,
  },
  {
    name: '手动查询',
    path: '/mobile/manual-query',
    element: <ManualQueryPage />,
    visible: false,
  },
  {
    name: '操作记录',
    path: '/mobile/records',
    element: <RecordsPage />,
    visible: false,
  },
];

export default routes;
