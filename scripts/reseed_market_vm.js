const oracledb = require("oracledb");

const statements = [
  "DELETE FROM luxury_items",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Oracle Corp (ORCL)', 141.50, 'stock')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Microsoft Corp (MSFT)', 415.20, 'stock')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('JPMorgan Chase (JPM)', 198.60, 'stock')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('NVIDIA Corp (NVDA)', 924.60, 'stock')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Apple Inc (AAPL)', 187.23, 'stock')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('US Treasury Bond 10Y', 101.80, 'bond')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('US Treasury Bill 6M', 99.40, 'bond')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Investment Grade Corp Bond A', 102.30, 'bond')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('High Yield Corp Bond B', 95.70, 'bond')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Vanguard S&P 500 ETF (VOO)', 490.00, 'etf')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('SPDR S&P 500 ETF (SPY)', 488.00, 'etf')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Invesco QQQ Trust (QQQ)', 418.00, 'etf')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Vanguard Total Market ETF (VTI)', 235.60, 'etf')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Bitcoin (BTC)', 68450.00, 'crypto')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Ethereum (ETH)', 3620.00, 'crypto')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Solana (SOL)', 145.00, 'crypto')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Gold Spot (XAU)', 2280.00, 'metal')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Silver Spot (XAG)', 28.50, 'metal')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('20+ Year Treasury ETF (TLT)', 94.20, 'bond_etf')",
  "INSERT INTO luxury_items (name, price, category) VALUES ('Corporate Bond ETF (LQD)', 109.30, 'bond_etf')",
];

async function main() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
    });
    for (const sql of statements) {
      await conn.execute(sql);
    }
    await conn.commit();
    const result = await conn.execute("SELECT COUNT(*) FROM luxury_items");
    console.log("rows_seeded", result.rows?.[0]?.[0]);
  } finally {
    if (conn) await conn.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
