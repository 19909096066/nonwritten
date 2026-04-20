const mysql = require("mysql2/promise");

async function main() {
  const pool = mysql.createPool({
    host: "gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com",
    port: 29477,
    user: "root",
    password: "Mygbbyy1.",
    database: "nonwoven"
  });

  // 检查 P0426020068 批号的入库记录
  const [stockItems] = await pool.execute(
    "SELECT batch_no, package_no, qr_code, status FROM raw_materials WHERE batch_no LIKE 'P0426020068%'"
  );
  
  console.log("=== P0426020068 批号入库记录 ===");
  console.log(`共 ${stockItems.length} 条记录`);
  console.log("批号列表:", [...new Set(stockItems.map(s => s.batch_no))]);
  console.log("包号列表:", stockItems.map(s => s.package_no).join(", "));

  // 检查所有入库批号
  const [allBatches] = await pool.execute(
    "SELECT DISTINCT batch_no FROM raw_materials WHERE status = 'in_stock' ORDER BY batch_no"
  );
  console.log("\n=== 所有入库批号 ===");
  console.log(allBatches.slice(0, 20).map(b => b.batch_no).join(", "));

  await pool.end();
}

main().catch(console.error);
