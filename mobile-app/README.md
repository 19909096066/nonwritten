# 欢迎使用你的秒哒应用代码包
秒哒应用链接
    URL:https://www.miaoda.cn/projects/app-9s1afi57chs1

# Uniapp移动端应用

## 项目简介

这是无纺布原材料管理系统的移动端应用，使用Uniapp框架开发，支持H5、微信小程序和安卓App。

## 技术栈

- **框架**: Uniapp + Vue3 + TypeScript
- **后端**: Supabase
- **UI**: 自定义组件库
- **扫码**: uni.scanCode API

## 功能模块

### 1. 扫码入库
- 扫描二维码获取物料信息
- 自动解析批次号、包号、型号等
- 确认后提交入库记录

### 2. 扫码出库
- 扫描二维码查询物料状态
- 验证在库状态后执行出库
- 记录出库时间和操作人

### 3. 扫码查询
- 扫描二维码查看物料详情
- 显示入库、出库等完整信息
- 支持跳转到批次/型号汇总

### 4. 手动查询
- 按批次号或型号查询
- 显示在库汇总（总卷数、总重量）
- 展示所有物料明细列表

### 5. 操作记录
- 查看最近20条本地操作记录
- 显示操作类型、时间、详情
- 支持清空本地记录

## 项目结构

```
mobile-app/
├── src/
│   ├── pages/              # 页面
│   │   ├── index/          # 首页
│   │   ├── scan-in/        # 扫码入库
│   │   ├── scan-out/       # 扫码出库
│   │   ├── scan-query/     # 扫码查询
│   │   ├── manual-query/   # 手动查询
│   │   ├── records/        # 操作记录
│   │   └── login/          # 登录页
│   ├── api/                # API接口
│   │   └── index.ts        # Supabase API封装
│   ├── utils/              # 工具函数
│   │   └── common.ts       # 通用工具
│   ├── styles/             # 样式
│   │   └── common.css      # 全局样式
│   ├── static/             # 静态资源
│   │   └── tabbar/         # 底部导航图标
│   ├── App.vue             # 应用入口
│   ├── main.ts             # 主文件
│   ├── pages.json          # 页面配置
│   └── manifest.json       # 应用配置
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 配置说明

### 1. Supabase配置

在 `src/utils/common.ts` 中配置Supabase连接信息：

```typescript
export const SUPABASE_URL = 'YOUR_SUPABASE_URL'
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
```

### 2. 微信小程序配置

在 `src/manifest.json` 中配置微信小程序appid：

```json
{
  "mp-weixin": {
    "appid": "YOUR_WEIXIN_APPID"
  }
}
```

### 3. Tabbar图标

需要准备以下图标文件（建议尺寸：81x81px）：

- `src/static/tabbar/home.png` - 首页未选中
- `src/static/tabbar/home-active.png` - 首页选中
- `src/static/tabbar/search.png` - 查询未选中
- `src/static/tabbar/search-active.png` - 查询选中
- `src/static/tabbar/record.png` - 记录未选中
- `src/static/tabbar/record-active.png` - 记录选中

## 开发指南

### 安装依赖

```bash
cd mobile-app
pnpm install
```

### 运行开发环境

```bash
# H5
pnpm dev:h5

# 微信小程序
pnpm dev:mp-weixin

# App
pnpm dev:app
```

### 构建生产版本

```bash
# H5
pnpm build:h5

# 微信小程序
pnpm build:mp-weixin

# App
pnpm build:app
```

## 二维码格式

原始字符串格式：`P0126020012-01J1-8~kg~2026-02-04~140.15~B1250050T1`

解析规则：
- 批次号：从段1中提取最后一个`-`左侧部分（如：P0126020012-01J1）
- 包号：最后一个`-`右侧部分（如：8）
- 单位：段2（如：kg）
- 生产日期：段3（如：2026-02-04）
- 重量：段4（如：140.15）
- 原材料型号：段5（如：B1250050T1）

## 权限说明

用户权限由后台管理系统配置，包括：
- `scan_in`: 扫码入库权限
- `scan_out`: 扫码出库权限
- `scan_query`: 扫码查询权限
- `manual_query`: 手动查询权限
- `view_records`: 查看记录权限

管理员（role='admin'）自动拥有所有权限。

## 本地存储

应用使用uni.storage存储本地操作记录：
- 存储键：`operation_records`
- 最多保存：20条记录
- 数据格式：OperationLog数组

## 注意事项

1. **扫码功能**：需要在真机或模拟器上测试，H5环境可能不支持
2. **权限验证**：所有操作都需要用户登录并具有相应权限
3. **网络请求**：确保Supabase配置正确且网络可访问
4. **数据同步**：本地记录仅保存在设备上，不会同步到服务器
5. **小程序审核**：发布微信小程序前需要配置合法域名

## 常见问题

### Q: 扫码功能无法使用？
A: 请确保：
- 在真机上测试（部分模拟器不支持）
- 已授予相机权限
- 二维码格式正确

### Q: 登录失败？
A: 请检查：
- Supabase配置是否正确
- 网络连接是否正常
- 用户账号密码是否正确

### Q: 数据不显示？
A: 请确认：
- 用户是否有相应权限
- 数据库中是否有数据
- 网络请求是否成功

## 更新日志

### v1.0.0 (2026-02-21)
- 初始版本发布
- 实现扫码入库、出库、查询功能
- 实现手动查询和操作记录功能
- 支持H5、微信小程序、安卓App

## 许可证

© 2026 原材料管理系统
