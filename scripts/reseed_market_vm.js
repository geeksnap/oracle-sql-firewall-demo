const oracledb = require("oracledb");
const manifest = require("../seed/luminaforge-demo-seed.json");

async function main() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
    });
    await conn.execute("DELETE FROM luxury_items");
    for (const item of manifest.luxuryItems) {
      await conn.execute(
        `INSERT INTO luxury_items (id, name, price, category)
         VALUES (:id, :name, :price, :category)`,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
        },
      );
    }
    await conn.commit();
    const result = await conn.execute("SELECT COUNT(*) FROM luxury_items");
    console.log("rows_seeded", result.rows?.[0]?.[0]);
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) await conn.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
