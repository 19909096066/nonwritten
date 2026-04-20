# 无纺布原材料管理系统需求文档

## 1. 项目背景与目标
本系统旨在为无纺布生产企业提供一套完整的原材料管理系统,实现对原材料入库、出库、库存管理、质检等环节的数字化管控,提升管理效率和数据准确性。

## 2. 系统总体架构

### 2.1 应用类型
本系统为H5应用,支持扫码操作、手动查询、本地操作记录查看等功能。

### 2.2 后台管理
使用Vue3 + Element Plus开发,提供库存管理、用户管理、质检中心、操作日志、数据概览等功能模块。

## 3. 功能需求

### 3.1 H5应用

#### 3.1.1 扫码入库
- 调用设备摄像头扫描二维码
- 解析二维码为:批次号、包号、原材料型号、生产日期、重量、单位
- 用户确认后提交入库

#### 3.1.2 扫码出库
- 扫描二维码
- 校验物料状态为在库后更新为已出库

#### 3.1.3 扫码查询
- 扫描二维码
- 显示物料详情及批次/型号汇总

#### 3.1.4 手动查询
- 输入批次号或型号
- 显示在库汇总和明细列表

#### 3.1.5 操作记录
- 查看最近20条本地缓存的出入库操作

### 3.2 后台管理

#### 3.2.1 首页
- 数据卡片:总库存、今日出入库数、待处理质检任务数
- 图表:各原材料型号库存占比、近7天出入库趋势

#### 3.2.2 库存管理
- 库存明细:展示所有原材料,支持筛选
- 入库明细:展示在库记录
- 出库明细:展示已出库记录
- 批量入库:下载模板、上传Excel、数据写入

#### 3.2.3 用户管理
- 用户列表、新增、编辑、删除
- 权限分配:App权限、后台权限

#### 3.2.4 质检中心
- 质检标准管理:列表、新增/编辑、删除
- 采购质检:列表、新增、编辑、删除
- 生产质检:每日汇总、查看明细
- 次品明细:列表、筛选

#### 3.2.5 操作日志
- 列表展示所有操作记录
- 支持筛选

## 4. 数据库设计

### 4.1 集合 raw_material
- 字段:qrCode、batchNo、packageNo、model、productionDate、weight、unit、status、createdAt、outAt、operator、remark

### 4.2 集合 operation_log
- 字段:_id、qrCode、operationType、operator、operateTime、detail、ip

### 4.3 集合 users
- 字段:_id、phone、name、password、role、appPermissions、webPermissions、createdAt、lastLogin

### 4.4 集合 qc_standard
- 字段:_id、materialModel、weightTolerance、thicknessTolerance

### 4.5 集合 qc_purchase
- 字段:_id、time、batchNo、packageNo、materialModel、weight、thickness、result、reason、inspector、createdAt

### 4.6 集合 qc_production
- 字段:_id、date、line、qualifiedCount、unqualifiedCount、rate、details

### 4.7 集合 qc_defect
- 字段:_id、source、time、batchNo、line、packageNo、materialModel、reason

## 5. 二维码解析规则
- 原始字符串格式:由5段组成,用~分隔
- 解析规则:批次号、包号、单位、生产日期、重量、原材料型号

## 6. 其他说明
- 数据一致性:防止重复入库,保证出库原子性
- 权限控制:所有操作需验证用户身份与权限
- 日志追溯:记录所有关键操作
- 扩展性:支持库位管理、有效期预警、离线模式等模块