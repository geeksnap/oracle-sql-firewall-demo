const fs = require("fs");
const path = require("path");
const oracledb = require("oracledb");

const clientLibDir =
  process.env.ORACLE_CLIENT_LIBDIR ?? "/usr/lib/oracle/23/client64/lib";

try {
  oracledb.initOracleClient({ libDir: clientLibDir });
} catch (e) {
  const msg = String(e?.message ?? e);
  if (!msg.includes("already")) throw e;
}

function isSqlPlusDirective(line) {
  return /^(SET|PROMPT|WHENEVER|SPOOL|EXIT|QUIT|CONNECT|DISCONNECT)\b/i.test(line);
}

function stripInlineComment(line) {
  return line.replace(/\s*--.*$/, "").trimEnd();
}

function splitSimpleStatements(chunk) {
  const blocks = [];
  let stmt = "";
  let inPlsql = false;

  for (const line of chunk.split("\n")) {
    const trimmed = stripInlineComment(line).trim();

    if (!inPlsql && (/^BEGIN\s*$/i.test(trimmed) || /^DECLARE\b/i.test(trimmed))) {
      const pending = stmt.trim().replace(/;\s*$/, "");
      if (pending) blocks.push(pending);
      stmt = line;
      inPlsql = true;
      continue;
    }

    stmt += (stmt ? "\n" : "") + line;

    if (inPlsql) {
      if (/^END;\s*$/i.test(trimmed)) {
        blocks.push(stmt.trim());
        stmt = "";
        inPlsql = false;
      }
      continue;
    }

    if (trimmed.endsWith(";")) {
      const s = stmt.trim().replace(/;\s*$/, "");
      if (s) blocks.push(s);
      stmt = "";
    }
  }

  const tail = stmt.trim().replace(/;\s*$/, "");
  if (tail) blocks.push(tail);
  return blocks;
}

function splitSqlBlocks(sql) {
  const lines = [];
  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--") || isSqlPlusDirective(trimmed)) continue;
    if (trimmed.startsWith("@@")) continue;
    lines.push(stripInlineComment(line));
  }

  const blocks = [];
  let buf = [];

  const flushBuf = () => {
    const chunk = buf.join("\n").trim();
    buf = [];
    if (!chunk) return;
    if (/^(DECLARE|BEGIN)\b/i.test(chunk)) {
      blocks.push(chunk);
      return;
    }
    blocks.push(...splitSimpleStatements(chunk));
  };

  for (const line of lines) {
    if (line.trim() === "/") {
      flushBuf();
      continue;
    }
    buf.push(line);
  }
  flushBuf();
  return blocks.filter(Boolean);
}

async function main() {
  const user = process.env.DB_USER ?? "luminaforge";
  const password = process.env.DB_PASSWORD;
  const connectString = process.env.DB_CONNECTION_STRING;
  const scriptPath = process.argv[2];

  if (!password || !connectString) {
    throw new Error("Missing DB_PASSWORD or DB_CONNECTION_STRING");
  }
  if (!scriptPath) throw new Error("Usage: node run_reset_demo_data_vm.js <sql_file_path>");

  const sql = fs.readFileSync(path.resolve(scriptPath), "utf8");
  const blocks = splitSqlBlocks(sql);
  let connection;
  try {
    connection = await oracledb.getConnection({ user, password, connectString });
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      try {
        await connection.execute(block, [], { autoCommit: true });
      } catch (err) {
        const preview = block.split("\n").slice(0, 3).join(" ").slice(0, 220);
        console.error(`Failed at block ${i + 1}/${blocks.length}: ${preview}`);
        throw err;
      }
    }
    console.log(`Executed ${blocks.length} SQL blocks`);
  } finally {
    if (connection) await connection.close();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
