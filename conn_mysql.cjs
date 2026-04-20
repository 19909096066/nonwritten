const mysql = require('mysql2/promise');
(async() => {
  try {
    const c = await mysql.createConnection({
      host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
      port: 29477,
      user: 'root',
      password: 'Mygbbyy1.',
      database: 'nonwoven'
    });
    
    console.log('Connected! Tables:');
    const [tables] = await c.query('SHOW TABLES');
    console.log(tables.map(x => Object.values(x)[0]).join('\n'));
    
    // Get raw_materials structure
    console.log('\n=== DESC raw_materials ===');
    const [desc] = await c.query('DESC raw_materials');
    desc.forEach(f => console.log(`${f.Field} | ${f.Type} | ${f.Null} | ${f.Key} | ${f.Default}`));
    
    // Check if products table exists
    console.log('\n=== Checking for products table ===');
    try {
      const [prod] = await c.query('DESC products');
      console.log('products table EXISTS');
      prod.forEach(f => console.log(`${f.Field} | ${f.Type} | ${f.Null} | ${f.Key} | ${f.Default}`));
    } catch(e) {
      console.log('products table does NOT exist');
    }
    
    await c.end();
    console.log('\nDone!');
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
