# RLS策略修复说明

## 问题描述
用户反馈：H5页面入库成功，但后台管理页面看不到数据。

## 问题分析

### 1. 数据确认
通过SQL查询确认：
- 数据已成功写入数据库（raw_material表有1条记录）
- 入库操作日志已记录（operation_log表）
- 用户权限配置正确（app_permissions和web_permissions都已设置）

### 2. 根本原因
RLS（Row Level Security）策略中使用了不存在的`uid()`函数，导致策略无法正确执行。

**原始策略**：
```sql
CREATE POLICY "管理员可以管理所有原材料" ON raw_material
  FOR ALL TO authenticated USING (is_admin(uid()));
```

**问题**：
- `uid()`函数不存在
- 应该使用`auth.uid()`来获取当前登录用户的ID
- 导致所有基于用户ID的权限检查都失败

### 3. 影响范围
- ✅ **入库操作**：INSERT策略的WITH CHECK为true，不依赖uid()，所以入库成功
- ❌ **查询操作**：SELECT策略依赖uid()检查权限，导致查询失败
- ❌ **出库操作**：UPDATE策略依赖uid()检查权限，可能也会失败
- ❌ **管理员操作**：ALL策略依赖uid()，管理员权限无法生效

## 解决方案

### 方案1：创建uid()函数（已实施）
创建`uid()`函数作为`auth.uid()`的别名，保持向后兼容：

```sql
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT auth.uid();
$$;
```

### 方案2：修改RLS策略（已实施）
将所有策略中的`uid()`替换为`auth.uid()`：

```sql
-- 删除旧策略
DROP POLICY IF EXISTS "管理员可以管理所有原材料" ON raw_material;
DROP POLICY IF EXISTS "用户可以查看原材料" ON raw_material;
DROP POLICY IF EXISTS "用户可以入库" ON raw_material;
DROP POLICY IF EXISTS "用户可以出库" ON raw_material;

-- 重新创建策略
CREATE POLICY "管理员可以管理所有原材料" ON raw_material
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看原材料" ON raw_material
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        (web_permissions->>'stockView')::boolean = true
        OR (web_permissions->>'inDetail')::boolean = true
        OR (web_permissions->>'outDetail')::boolean = true
      )
    )
  );

CREATE POLICY "用户可以入库" ON raw_material
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (app_permissions->>'scanIn')::boolean = true
    )
  );

CREATE POLICY "用户可以出库" ON raw_material
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (app_permissions->>'scanOut')::boolean = true
    )
  );
```

## 修复验证

### 1. 函数验证
```sql
SELECT uid() as test_uid;
-- 结果：返回当前用户ID（未登录时为null）
```

### 2. 策略验证
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'raw_material';
-- 结果：所有策略都使用auth.uid()
```

### 3. 功能验证
- ✅ H5入库：数据成功写入数据库
- ✅ 后台查询：管理员可以查看所有数据
- ✅ 后台出库：有权限的用户可以执行出库操作
- ✅ 权限控制：普通用户只能看到有权限的数据

## 其他表的检查

### operation_log表
✅ 已正确使用`auth.uid()`，无需修改

### qc相关表
✅ 已正确使用`auth.uid()`，无需修改

### profiles表
✅ 已正确使用`auth.uid()`，无需修改

## 预防措施

### 1. 代码审查
- 所有RLS策略必须使用`auth.uid()`而不是`uid()`
- 除非明确创建了`uid()`函数作为别名

### 2. 测试流程
- 创建RLS策略后，必须测试：
  - 管理员权限
  - 普通用户权限
  - 无权限用户
  - 未登录用户

### 3. 迁移文件规范
- 所有迁移文件中的RLS策略都应使用`auth.uid()`
- 如果需要使用`uid()`，必须先创建该函数

## 总结

**问题**：RLS策略使用了不存在的`uid()`函数

**影响**：后台管理页面无法查询数据（虽然数据已成功入库）

**解决**：
1. 创建`uid()`函数作为`auth.uid()`的别名
2. 修改所有RLS策略使用`auth.uid()`

**结果**：
- ✅ 后台管理页面可以正常查询数据
- ✅ 权限控制正常工作
- ✅ 所有CRUD操作都正常

**经验教训**：
- RLS策略必须在创建后立即测试
- 使用标准的Supabase函数（如`auth.uid()`）
- 避免使用自定义函数名，除非有充分理由
