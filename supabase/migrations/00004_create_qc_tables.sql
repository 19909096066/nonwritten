-- 创建质检结果枚举
CREATE TYPE public.qc_result AS ENUM ('qualified', 'unqualified');

-- 创建质检来源枚举
CREATE TYPE public.qc_source AS ENUM ('purchase', 'production');

-- 1. 质检标准表
CREATE TABLE public.qc_standard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_model text UNIQUE NOT NULL,
  weight_tolerance jsonb NOT NULL DEFAULT '{"min": 0, "max": 0}'::jsonb,
  thickness_tolerance jsonb NOT NULL DEFAULT '{"min": 0, "max": 0}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 采购质检表
CREATE TABLE public.qc_purchase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time timestamptz DEFAULT now(),
  batch_no text NOT NULL,
  package_no text NOT NULL,
  material_model text NOT NULL,
  weight numeric(10, 2) NOT NULL,
  thickness numeric(10, 2) NOT NULL,
  result public.qc_result NOT NULL,
  reason text,
  inspector text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. 生产质检汇总表
CREATE TABLE public.qc_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  line text NOT NULL,
  qualified_count integer DEFAULT 0,
  unqualified_count integer DEFAULT 0,
  rate numeric(5, 2) DEFAULT 0,
  details jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, line)
);

-- 4. 次品明细表
CREATE TABLE public.qc_defect (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.qc_source NOT NULL,
  time timestamptz NOT NULL,
  batch_no text,
  line text,
  package_no text NOT NULL,
  material_model text,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_qc_purchase_batch ON qc_purchase(batch_no);
CREATE INDEX idx_qc_purchase_model ON qc_purchase(material_model);
CREATE INDEX idx_qc_production_date ON qc_production(date DESC);
CREATE INDEX idx_qc_defect_source ON qc_defect(source);
CREATE INDEX idx_qc_defect_time ON qc_defect(time DESC);

-- 配置RLS策略
ALTER TABLE qc_standard ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_purchase ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_defect ENABLE ROW LEVEL SECURITY;

-- 质检标准策略
CREATE POLICY "管理员可以管理质检标准" ON qc_standard
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看质检标准" ON qc_standard
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (web_permissions->>'qcStandard')::boolean = true
    )
  );

-- 采购质检策略
CREATE POLICY "管理员可以管理采购质检" ON qc_purchase
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看采购质检" ON qc_purchase
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (web_permissions->>'qcPurchase')::boolean = true
    )
  );

CREATE POLICY "用户可以添加采购质检" ON qc_purchase
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (web_permissions->>'qcPurchase')::boolean = true
    )
  );

-- 生产质检策略
CREATE POLICY "管理员可以管理生产质检" ON qc_production
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看生产质检" ON qc_production
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (web_permissions->>'qcProduction')::boolean = true
    )
  );

-- 次品明细策略
CREATE POLICY "管理员可以管理次品明细" ON qc_defect
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看次品明细" ON qc_defect
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (web_permissions->>'qcDefect')::boolean = true
    )
  );