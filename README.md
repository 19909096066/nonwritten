# 欢迎使用你的秒哒应用代码包
秒哒应用链接
    URL:https://www.miaoda.cn/projects/app-9s1afi57chs1

## 介绍

无纺布原材料管理系统 - 包含Web管理后台和Uniapp移动端应用

### 项目组成

- **Web管理后台**：基于React + shadcn/ui开发，提供库存管理、用户管理、质检中心等功能
- **Uniapp移动端**：基于Vue3 + Uniapp开发，支持H5、微信小程序、安卓App，提供扫码入库、出库、查询等功能

## 目录结构

```
├── README.md                 # 说明文档
├── components.json           # 组件库配置
├── index.html                # Web入口文件
├── package.json              # Web包管理
├── postcss.config.js         # postcss配置
├── public                    # 静态资源目录
│   ├── favicon.png           # 图标
│   └── images                # 图片资源
├── src                       # Web源码目录
│   ├── App.tsx               # Web入口文件
│   ├── components            # 组件目录
│   ├── contexts              # 上下文目录
│   ├── db                    # 数据库配置目录
│   ├── hooks                 # 通用钩子函数目录
│   ├── index.css             # 全局样式
│   ├── layouts               # 布局目录
│   ├── lib                   # 工具库目录
│   ├── main.tsx              # 入口文件
│   ├── routes.tsx            # 路由配置
│   ├── pages                 # 页面目录
│   ├── services              # 数据库交互目录
│   └── types                 # 类型定义目录
├── mobile-app                # ⭐ Uniapp移动端应用（新增）
│   ├── README.md             # 移动端说明文档
│   ├── SETUP.md              # 移动端配置指南
│   ├── package.json          # 移动端包管理
│   └── src                   # 移动端源码
│       ├── pages             # 页面目录（扫码入库/出库/查询等）
│       ├── api               # API接口
│       ├── utils             # 工具函数
│       └── styles            # 样式文件
├── supabase                  # Supabase配置
├── tsconfig.app.json         # ts前端配置文件
├── tsconfig.json             # ts配置文件
├── tsconfig.node.json        # ts node端配置文件
└── vite.config.ts            # vite配置文件
```

## 技术栈

### Web管理后台
- Vite、TypeScript、React、Supabase、shadcn/ui、Tailwind CSS

### Uniapp移动端
- Uniapp、Vue3、TypeScript、Supabase

## 本地开发

### Web管理后台开发

#### 环境要求

```
# Node.js ≥ 20
# npm ≥ 10
例如：
# node -v   # v20.18.3
# npm -v    # 10.8.2
```

#### 安装步骤

```bash
# Step 1: 安装依赖
npm i

# Step 2: 启动开发服务器
npm run dev -- --host 127.0.0.1
```

### Uniapp移动端开发

详细配置请查看：[mobile-app/SETUP.md](mobile-app/SETUP.md)

#### 快速开始

```bash
# Step 1: 进入移动端目录
cd mobile-app

# Step 2: 安装依赖
pnpm install

# Step 3: 配置Supabase（编辑 src/utils/common.ts）
# 将SUPABASE_URL和SUPABASE_ANON_KEY替换为实际值

# Step 4: 运行H5版本
pnpm dev:h5

# 或运行微信小程序
pnpm dev:mp-weixin

# 或运行App
pnpm dev:app
```

## 功能模块

### Web管理后台

1. **首页数据概览**
   - 库存统计卡片
   - 图表展示（库存占比、出入库趋势）

2. **库存管理**
   - 库存明细查询
   - 入库明细
   - 出库明细
   - 批量入库（Excel导入）

3. **用户管理**
   - 用户列表
   - 权限分配（App权限、后台权限）
   - 角色管理

4. **质检中心**
   - 质检标准管理
   - 采购质检
   - 生产质检
   - 次品明细

5. **操作日志**
   - 所有操作记录查询
   - 筛选和导出

### Uniapp移动端

1. **扫码入库**
   - 扫描二维码
   - 自动解析物料信息
   - 确认入库

2. **扫码出库**
   - 扫描二维码
   - 验证库存状态
   - 执行出库

3. **扫码查询**
   - 扫描二维码
   - 查看物料详情
   - 跳转批次/型号汇总

4. **手动查询**
   - 按批次号查询
   - 按型号查询
   - 显示汇总和明细

5. **操作记录**
   - 查看本地操作记录
   - 显示最近20条记录

## 如何在本地编辑代码？

您可以选择 [VSCode](https://code.visualstudio.com/Download) 或者您常用的任何 IDE 编辑器，唯一的要求是安装 Node.js 和 npm。

### 在 Windows 上安装 Node.js

```
# Step 1: 访问Node.js官网：https://nodejs.org/，点击下载后，会根据你的系统自动选择合适的版本（32位或64位）。
# Step 2: 运行安装程序：下载完成后，双击运行安装程序。
# Step 3: 完成安装：按照安装向导完成安装过程。
# Step 4: 验证安装：在命令提示符（cmd）或IDE终端（terminal）中输入 node -v 和 npm -v 来检查 Node.js 和 npm 是否正确安装。
```

### 在 macOS 上安装 Node.js

```
# Step 1: 使用Homebrew安装（推荐方法）：打开终端。输入命令brew install node并回车。如果尚未安装Homebrew，需要先安装Homebrew，
可以通过在终端中运行如下命令来安装：
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
或者使用官网安装程序：访问Node.js官网。下载macOS的.pkg安装包。打开下载的.pkg文件，按照提示完成安装。
# Step 2: 验证安装：在命令提示符（cmd）或IDE终端（terminal）中输入 node -v 和 npm -v 来检查 Node.js 和 npm 是否正确安装。
```

## 如何开发后端服务？

配置环境变量，安装相关依赖。如需使用数据库，请使用 Supabase 官方版本或自行部署开源版本的 Supabase。

## 如何配置应用中的三方 API？

具体三方 API 调用方法，请参考帮助文档：[源码导出](https://cloud.baidu.com/doc/MIAODA/s/Xmewgmsq7)，了解更多详细内容。

## 了解更多

您也可以查看帮助文档：[源码导出](https://cloud.baidu.com/doc/MIAODA/s/Xmewgmsq7)，了解更多详细内容。

## 移动端详细文档

- [移动端README](mobile-app/README.md) - 移动端项目介绍和功能说明
- [移动端配置指南](mobile-app/SETUP.md) - 详细的配置和部署指南
