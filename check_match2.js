const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
    port: 29477,
    user: 'root',
    password: 'Mygbbyy1.',
    database: 'nonwoven'
  });
  
  // 获取所有入库记录
  const [inStock] = await pool.execute("SELECT batch_no, package_no, qr_code FROM raw_materials WHERE status='in_stock'");
  
  // 获取所有待入库记录
  const [pending] = await pool.execute("SELECT id, batch_no, package_no FROM shipping_items WHERE status='pending'");
  
  let matchCount = 0;
  console.log('=== 检查匹配情况 ===');
  
  for (const item of pending) {
    const pBatch = item.batch_no;
    const pPackage = item.package_no;
    
    // 查找匹配的入库记录
    const matched = inStock.find(m => {
      // 批号匹配（入库批号以待入库批号开头）
      const batchMatch = m.batch_no === pBatch || m.batch_no.startsWith(pBatch + '-');
      // 包号精确匹配
      const packageMatch = m.package_no === pPackage;
      return batchMatch && packageMatch;
    });
    
    if (matched) {
      matchCount++;
      console.log(`✓ 匹配: 待入库(${pBatch}, ${pPackage}) -> 入库(${matched.batch_no}, ${matched.package_no})`);
    }
  }
  
  console.log(`\n总待入库: ${pending.length}, 可匹配: ${matchCount}`);
  await pool.end();
}
main();
