const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
    port: 29477,
    user: 'root',
    password: 'Mygbbyy1.',
    database: 'nonwoven'
  });
  
  // 获取所有入库的批号前缀
  const [r1] = await pool.execute("SELECT DISTINCT batch_no FROM raw_materials WHERE status='in_stock'");
  const inBatchNos = r1.map(r => r.batch_no);
  console.log('=== 入库批号列表 ===');
  console.log(inBatchNos.slice(0, 10));
  
  // 获取所有待入库的批号
  const [r2] = await pool.execute("SELECT DISTINCT batch_no FROM shipping_items WHERE status='pending'");
  const pendingBatchNos = r2.map(r => r.batch_no);
  console.log('\n=== 待入库批号列表 ===');
  console.log(pendingBatchNos.slice(0, 10));
  
  // 查找可能匹配的（入库批号以待入库批号开头）
  console.log('\n=== 可能匹配的批号 ===');
  for (const pBatch of pendingBatchNos) {
    const matched = inBatchNos.filter(inBatch => inBatch.startsWith(pBatch + '-') || inBatch === pBatch);
    if (matched.length > 0) {
      console.log(`待入库批号 ${pBatch} -> 可能匹配的入库批号: ${matched.join(', ')}`);
    }
  }
  
  await pool.end();
}
main();
