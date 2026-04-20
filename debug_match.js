const mysql = require("mysql2/promise");

async function main() {
  const pool = mysql.createPool({
    host: "gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com",
    port: 29477,
    user: "root",
    password: "Mygbbyy1.",
    database: "nonwoven"
  });

  // 测试查询
  const testBatchNo = 'P0426020068';
  const testPackageNo = '95';

  console.log("=== 测试查询 ===");
  console.log(`批号: ${testBatchNo}, 包号: ${testPackageNo}`);
  
  // 查询1: 精确匹配
  const [r1] = await pool.execute(
    "SELECT id, batch_no, package_no FROM raw_materials WHERE batch_no = ? AND package_no = ? AND status = 'in_stock'",
    [testBatchNo, testPackageNo]
  );
  console.log(`精确匹配: ${r1.length} 条`);

  // 查询2: 前缀匹配
  const [r2] = await pool.execute(
    "SELECT id, batch_no, package_no FROM raw_materials WHERE batch_no LIKE ? AND package_no = ? AND status = 'in_stock'",
    [`${testBatchNo}-%`, testPackageNo]
  );
  console.log(`前缀匹配: ${r2.length} 条`);
  console.log(`结果: ${JSON.stringify(r2)}`);

  // 查询3: 包号匹配的所有记录
  const [r3] = await pool.execute(
    "SELECT id, batch_no, package_no, status FROM raw_materials WHERE package_no = ?",
    [testPackageNo]
  );
  console.log(`\n包号=${testPackageNo}的所有记录: ${r3.length} 条`);
  console.log(JSON.stringify(r3, null, 2));

  await pool.end();
}

main().catch(console.error);
