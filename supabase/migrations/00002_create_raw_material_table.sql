-- 创建物料状态枚举
CREATE TYPE public.material_status AS ENUM ('in_stock', 'out_stock');

-- 创建原材料表
CREATE TABLE public.raw_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code text UNIQUE NOT NULL,
  batch_no text NOT NULL,
  package_no text NOT NULL,
  model text NOT NULL,
  production_date date NOT NULL,
  weight numeric(10, 2) NOT NULL,
  unit text DEFAULT 'kg',
  status public.material_status DEFAULT 'in_stock',
  created_at timestamptz DEFAULT now(),
  out_at timestamptz,
  operator text,
  remark text
);

-- 创建索引
CREATE INDEX idx_raw_material_qr_code ON raw_material(qr_code);
CREATE INDEX idx_raw_material_batch_no ON raw_material(batch_no);
CREATE INDEX idx_raw_material_model ON raw_material(model);
CREATE INDEX idx_raw_material_status ON raw_material(status);

-- 配置RLS策略
ALTER TABLE raw_material ENABLE ROW LEVEL SECURITY;

-- 管理员拥有所有权限
CREATE POLICY "管理员可以管理所有原材料" ON raw_material
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 普通用户根据权限查看
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

-- 用户可以插入（入库权限）
CREATE POLICY "用户可以入库" ON raw_material
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (app_permissions->>'scanIn')::boolean = true
    )
  );

-- 用户可以更新（出库权限）
CREATE POLICY "用户可以出库" ON raw_material
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (app_permissions->>'scanOut')::boolean = true
    )
  );