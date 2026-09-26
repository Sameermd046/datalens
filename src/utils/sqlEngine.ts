import alasql from 'alasql';

// Configure alasql options
try {
  alasql.options.casesensitive = false;
} catch (e) {
  // Ignore if already set
}

export interface SQLQueryResult {
  success: boolean;
  data: Record<string, any>[];
  columns: string[];
  rowCount: number;
  columnCount: number;
  executionTimeMs: number;
  activeDatabase?: string;
  error?: string;
  message?: string;
}

export interface TableMeta {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
}

export interface DatabaseMeta {
  name: string;
  tables: TableMeta[];
}

class DatabaseManager {
  private currentDb: string = 'main_db';
  private databases: Map<string, Map<string, Record<string, any>[]>> = new Map();

  constructor() {
    this.ensureDatabase('main_db');
  }

  public ensureDatabase(dbName: string): Map<string, Record<string, any>[]> {
    const cleanName = this.normalizeName(dbName) || 'main_db';
    if (!this.databases.has(cleanName)) {
      this.databases.set(cleanName, new Map());
    }
    return this.databases.get(cleanName)!;
  }

  public normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // remove extension like .csv, .xlsx
      .replace(/[^a-z0-9_]/g, '_');
  }

  public getCurrentDatabase(): string {
    return this.currentDb;
  }

  public setCurrentDatabase(dbName: string): boolean {
    const cleanName = this.normalizeName(dbName);
    this.ensureDatabase(cleanName);
    this.currentDb = cleanName;
    return true;
  }

  public getDatabases(): string[] {
    return Array.from(this.databases.keys());
  }

  public createDatabase(dbName: string): boolean {
    const cleanName = this.normalizeName(dbName);
    if (!cleanName) return false;
    this.ensureDatabase(cleanName);
    return true;
  }

  public deleteDatabase(dbName: string): boolean {
    const cleanName = this.normalizeName(dbName);
    if (cleanName === 'main_db') return false; // Prevent removing default
    const deleted = this.databases.delete(cleanName);
    if (this.currentDb === cleanName) {
      this.currentDb = 'main_db';
    }
    return deleted;
  }

  public insertTable(dbName: string, tableName: string, data: Record<string, any>[]): string {
    const cleanDb = this.normalizeName(dbName) || this.currentDb;
    const cleanTable = this.normalizeName(tableName);
    if (!cleanTable) throw new Error('Table name cannot be empty.');

    const db = this.ensureDatabase(cleanDb);
    // Deep clone data to avoid mutation
    db.set(cleanTable, data.map(r => ({ ...r })));

    // Also mount in alasql engine directly
    this.syncAlasql();

    return cleanTable;
  }

  public getTable(dbName: string, tableName: string): Record<string, any>[] | undefined {
    const cleanDb = this.normalizeName(dbName);
    const cleanTable = this.normalizeName(tableName);
    const db = this.databases.get(cleanDb);
    if (!db) return undefined;
    return db.get(cleanTable);
  }

  public deleteTable(dbName: string, tableName: string): boolean {
    const cleanDb = this.normalizeName(dbName);
    const cleanTable = this.normalizeName(tableName);
    const db = this.databases.get(cleanDb);
    if (!db) return false;
    const deleted = db.delete(cleanTable);
    this.syncAlasql();
    return deleted;
  }

  public getMetadata(): DatabaseMeta[] {
    const list: DatabaseMeta[] = [];
    for (const [dbName, tableMap] of this.databases.entries()) {
      const tables: TableMeta[] = [];
      for (const [tableName, rows] of tableMap.entries()) {
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        tables.push({
          name: tableName,
          rowCount: rows.length,
          columnCount: columns.length,
          columns
        });
      }
      list.push({ name: dbName, tables });
    }
    return list;
  }

  /**
   * Sync active dataset into database store
   */
  public syncActiveDataset(
    datasetName: string | null,
    activeData: Record<string, any>[],
    cleanedData?: Record<string, any>[],
    filteredData?: Record<string, any>[]
  ) {
    if (!activeData || activeData.length === 0) return;

    const mainDb = this.ensureDatabase('main_db');
    const curDb = this.ensureDatabase(this.currentDb);

    const dataCloned = activeData.map(r => ({ ...r }));

    // Register generic aliases across both main_db and currentDb
    mainDb.set('dataset', dataCloned);
    curDb.set('dataset', dataCloned);

    if (cleanedData && cleanedData.length > 0) {
      const cleanCloned = cleanedData.map(r => ({ ...r }));
      mainDb.set('cleaned_dataset', cleanCloned);
      curDb.set('cleaned_dataset', cleanCloned);
    }
    if (filteredData && filteredData.length > 0) {
      const filterCloned = filteredData.map(r => ({ ...r }));
      mainDb.set('filtered_dataset', filterCloned);
      curDb.set('filtered_dataset', filterCloned);
    }

    // Register by dataset file name and common variations
    if (datasetName) {
      const cleanName = this.normalizeName(datasetName);
      if (cleanName && cleanName !== 'dataset') {
        mainDb.set(cleanName, dataCloned);
        curDb.set(cleanName, dataCloned);
      }

      // Add common friendly aliases and typos (e.g. customers, csutomers, customer)
      if (cleanName.includes('customer') || cleanName.includes('csutomer')) {
        mainDb.set('customers', dataCloned);
        curDb.set('customers', dataCloned);
        mainDb.set('csutomers', dataCloned);
        curDb.set('csutomers', dataCloned);
        mainDb.set('customer', dataCloned);
        curDb.set('customer', dataCloned);
      }
      if (cleanName.includes('sale') || cleanName.includes('order') || cleanName.includes('ecom')) {
        mainDb.set('sales', dataCloned);
        curDb.set('sales', dataCloned);
        mainDb.set('orders', dataCloned);
        curDb.set('orders', dataCloned);
      }
      if (cleanName.includes('product') || cleanName.includes('item')) {
        mainDb.set('products', dataCloned);
        curDb.set('products', dataCloned);
      }
      if (cleanName.includes('employee') || cleanName.includes('headcount') || cleanName.includes('staff')) {
        mainDb.set('employees', dataCloned);
        curDb.set('employees', dataCloned);
        mainDb.set('employee', dataCloned);
        curDb.set('employee', dataCloned);
      }
    }

    this.syncAlasql();
  }

  /**
   * Reset / clear all databases and tables
   */
  public clearAll() {
    this.databases.clear();
    this.ensureDatabase('main_db');
    this.currentDb = 'main_db';
    if ((alasql as any).databases) {
      for (const k of Object.keys((alasql as any).databases)) {
        if ((alasql as any).databases[k]?.tables) {
          (alasql as any).databases[k].tables = {};
        }
      }
    }
    this.syncAlasql();
  }

  /**
   * Synchronizes all internal tables into alasql engine memory
   */
  public syncAlasql() {
    try {
      alasql.options.casesensitive = false;

      // Ensure databases exist in alasql
      for (const dbName of this.databases.keys()) {
        try {
          alasql(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        } catch (e) {
          // ignore
        }
        if (!(alasql as any).databases[dbName]) {
          (alasql as any).databases[dbName] = { tables: {} };
        }
        if (!(alasql as any).databases[dbName].tables) {
          (alasql as any).databases[dbName].tables = {};
        }
      }

      // Ensure 'alasql' default db exists
      if (!(alasql as any).databases.alasql) {
        (alasql as any).databases.alasql = { tables: {} };
      }
      if (!(alasql as any).databases.alasql.tables) {
        (alasql as any).databases.alasql.tables = {};
      }

      // Set current database in alasql
      const activeDbName = this.currentDb;
      try {
        alasql(`USE ${activeDbName}`);
      } catch (e) {
        (alasql as any).useid = activeDbName;
      }

      // Populate tables for each registered database
      for (const [dbName, tableMap] of this.databases.entries()) {
        const dbTables = (alasql as any).databases[dbName]?.tables;
        if (!dbTables) continue;

        for (const [tableName, rows] of tableMap.entries()) {
          const tableObj = { data: rows.map((r: Record<string, any>) => ({ ...r })) };
          dbTables[tableName] = tableObj;
          dbTables[tableName.toLowerCase()] = tableObj;
          dbTables[tableName.toUpperCase()] = tableObj;

          // Also mount to default alasql db for global fallback
          if ((alasql as any).databases.alasql?.tables) {
            (alasql as any).databases.alasql.tables[tableName] = tableObj;
            (alasql as any).databases.alasql.tables[tableName.toLowerCase()] = tableObj;
            (alasql as any).databases.alasql.tables[tableName.toUpperCase()] = tableObj;
          }
        }
      }

      // Also ensure active database has access to all tables registered across databases
      const activeDbTables = (alasql as any).databases[activeDbName]?.tables;
      if (activeDbTables) {
        for (const [, tableMap] of this.databases.entries()) {
          for (const [tableName, rows] of tableMap.entries()) {
            if (!activeDbTables[tableName]) {
              const tableObj = { data: rows.map((r: Record<string, any>) => ({ ...r })) };
              activeDbTables[tableName] = tableObj;
              activeDbTables[tableName.toLowerCase()] = tableObj;
              activeDbTables[tableName.toUpperCase()] = tableObj;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error during alasql sync:', err);
    }
  }
}

export const dbManager = new DatabaseManager();

/**
 * Executes standard SQL query in active database
 */
export function executeSQLQuery(
  sql: string,
  activeDataset: Record<string, any>[],
  cleanedDataset?: Record<string, any>[],
  filteredDataset?: Record<string, any>[],
  datasetName?: string | null,
  targetDatabase?: string
): SQLQueryResult {
  const startTime = performance.now();

  try {
    if (!sql || !sql.trim()) {
      return {
        success: false,
        data: [],
        columns: [],
        rowCount: 0,
        columnCount: 0,
        executionTimeMs: 0,
        error: 'SQL query cannot be empty.'
      };
    }

    const trimmed = sql.trim().replace(/;+$/, '');

    // Synchronize dataset into database manager
    dbManager.syncActiveDataset(datasetName || null, activeDataset, cleanedDataset, filteredDataset);

    if (targetDatabase) {
      dbManager.setCurrentDatabase(targetDatabase);
    }

    let activeDbName = dbManager.getCurrentDatabase();

    // 1. Intercept `USE <database>` or `USE DATABASE <database>`
    const useMatch = trimmed.match(/^USE(?:\s+DATABASE)?\s+([a-zA-Z0-9_]+)/i);
    if (useMatch) {
      const targetDb = dbManager.normalizeName(useMatch[1]);
      dbManager.setCurrentDatabase(targetDb);
      dbManager.syncAlasql();
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: [{ database: targetDb, status: 'Active Database Changed' }],
        columns: ['database', 'status'],
        rowCount: 1,
        columnCount: 2,
        executionTimeMs,
        activeDatabase: targetDb,
        message: `Active database switched to "${targetDb}".`
      };
    }

    // 2. Intercept `CREATE DATABASE <name>`
    const createDbMatch = trimmed.match(/^CREATE\s+DATABASE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
    if (createDbMatch) {
      const newDb = dbManager.normalizeName(createDbMatch[1]);
      dbManager.createDatabase(newDb);
      dbManager.syncAlasql();
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: [{ database: newDb, status: 'Database Created' }],
        columns: ['database', 'status'],
        rowCount: 1,
        columnCount: 2,
        executionTimeMs,
        activeDatabase: dbManager.getCurrentDatabase(),
        message: `Database "${newDb}" created successfully.`
      };
    }

    // 3. Intercept `DROP DATABASE <name>`
    const dropDbMatch = trimmed.match(/^DROP\s+DATABASE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
    if (dropDbMatch) {
      const targetDb = dbManager.normalizeName(dropDbMatch[1]);
      const deleted = dbManager.deleteDatabase(targetDb);
      dbManager.syncAlasql();
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: [{ database: targetDb, status: deleted ? 'Dropped' : 'Not Found or Protected' }],
        columns: ['database', 'status'],
        rowCount: 1,
        columnCount: 2,
        executionTimeMs,
        activeDatabase: dbManager.getCurrentDatabase(),
        message: deleted ? `Database "${targetDb}" dropped.` : `Could not drop database "${targetDb}".`
      };
    }

    // 4. Intercept `SHOW DATABASES` or `SHOW SCHEMAS`
    if (/^SHOW\s+(DATABASES|SCHEMAS)/i.test(trimmed)) {
      const dbs = dbManager.getDatabases().map(name => ({
        database_name: name,
        is_active: name === activeDbName ? 'YES' : 'NO'
      }));
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: dbs,
        columns: ['database_name', 'is_active'],
        rowCount: dbs.length,
        columnCount: 2,
        executionTimeMs,
        activeDatabase: activeDbName
      };
    }

    // 5. Intercept `SHOW TABLES`
    if (/^SHOW\s+TABLES/i.test(trimmed)) {
      const meta = dbManager.getMetadata().find(d => d.name === activeDbName);
      const tables = (meta?.tables || []).map(t => ({
        table_name: t.name,
        rows: t.rowCount,
        columns: t.columnCount
      }));
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: tables,
        columns: ['table_name', 'rows', 'columns'],
        rowCount: tables.length,
        columnCount: 3,
        executionTimeMs,
        activeDatabase: activeDbName
      };
    }

    // 6. Intercept `DROP TABLE <name>`
    const dropTableMatch = trimmed.match(/^DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
    if (dropTableMatch) {
      const tbl = dbManager.normalizeName(dropTableMatch[1]);
      const dropped = dbManager.deleteTable(activeDbName, tbl);
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: [{ table_name: tbl, status: dropped ? 'Dropped' : 'Table Not Found' }],
        columns: ['table_name', 'status'],
        rowCount: 1,
        columnCount: 2,
        executionTimeMs,
        activeDatabase: activeDbName,
        message: dropped ? `Table "${tbl}" deleted from database "${activeDbName}".` : `Table "${tbl}" not found.`
      };
    }

    // 7. Intercept `DESCRIBE <table>` or `DESC <table>`
    const descMatch = trimmed.match(/^(?:DESCRIBE|DESC)\s+([a-zA-Z0-9_]+)/i);
    if (descMatch) {
      const targetTable = dbManager.normalizeName(descMatch[1]);
      let tableData = dbManager.getTable(activeDbName, targetTable);
      if (!tableData) {
        // Try fallback to any database or active dataset
        for (const db of dbManager.getDatabases()) {
          const t = dbManager.getTable(db, targetTable);
          if (t) {
            tableData = t;
            break;
          }
        }
      }
      if (!tableData && activeDataset.length > 0) {
        tableData = activeDataset;
      }

      if (!tableData || tableData.length === 0) {
        throw new Error(`Table does not exist: "${targetTable}" in database "${activeDbName}"`);
      }

      const sample = tableData[0] || {};
      const cols = Object.keys(sample).map((col, idx) => ({
        column_id: idx + 1,
        column_name: col,
        sample_value: sample[col] !== null ? String(sample[col]) : 'null',
        inferred_type: typeof sample[col] === 'number' ? 'NUMERIC' : typeof sample[col] === 'boolean' ? 'BOOLEAN' : 'VARCHAR'
      }));
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: true,
        data: cols,
        columns: ['column_id', 'column_name', 'sample_value', 'inferred_type'],
        rowCount: cols.length,
        columnCount: 4,
        executionTimeMs,
        activeDatabase: activeDbName
      };
    }

    // Make sure alasql is synchronized
    dbManager.syncAlasql();

    // Execute standard SQL query
    let rawResult: any;
    try {
      rawResult = alasql(sql);
    } catch (engineErr: any) {
      const errStr = engineErr?.message || String(engineErr);

      // Check if table missing: "Table does not exist: <tablename>"
      const notFoundMatch = errStr.match(/Table does not exist:\s*['"`]?([a-zA-Z0-9_]+)['"`]?/i);
      
      // Also look for table name in the SQL query itself (FROM <tablename>)
      const fromMatch = trimmed.match(/FROM\s+['"`]?([a-zA-Z0-9_]+)['"`]?/i);
      const referencedTable = notFoundMatch ? dbManager.normalizeName(notFoundMatch[1]) : fromMatch ? dbManager.normalizeName(fromMatch[1]) : null;

      if (referencedTable) {
        // 1. Check if the table exists in another database
        let foundData: Record<string, any>[] | undefined;
        for (const db of dbManager.getDatabases()) {
          const t = dbManager.getTable(db, referencedTable);
          if (t) {
            foundData = t;
            break;
          }
        }

        // 2. Fallback to active dataset if user intended the loaded dataset
        if (!foundData && activeDataset.length > 0) {
          foundData = activeDataset;
        }

        if (foundData && foundData.length > 0) {
          // Insert table into active database and retry
          dbManager.insertTable(activeDbName, referencedTable, foundData);
          dbManager.syncAlasql();
          try {
            rawResult = alasql(sql);
          } catch (retryErr) {
            throw retryErr;
          }
        } else {
          throw engineErr;
        }
      } else {
        throw engineErr;
      }
    }

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    // Normalize output format
    let rows: Record<string, any>[] = [];
    if (Array.isArray(rawResult)) {
      if (rawResult.length > 0 && Array.isArray(rawResult[0])) {
        rows = rawResult[rawResult.length - 1];
      } else {
        rows = rawResult;
      }
    } else if (rawResult !== null && typeof rawResult === 'object') {
      rows = [rawResult];
    } else if (typeof rawResult === 'number' || typeof rawResult === 'string' || typeof rawResult === 'boolean') {
      rows = [{ result: rawResult }];
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      success: true,
      data: rows,
      columns,
      rowCount: rows.length,
      columnCount: columns.length,
      executionTimeMs,
      activeDatabase: activeDbName
    };
  } catch (err: any) {
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    const errorMessage = err?.message || String(err) || 'SQL execution failed.';
    return {
      success: false,
      data: [],
      columns: [],
      rowCount: 0,
      columnCount: 0,
      executionTimeMs,
      activeDatabase: dbManager.getCurrentDatabase(),
      error: `DuckDB / SQL Engine Error: ${errorMessage}`
    };
  }
}

export function generateSuggestedQueries(
  columns: { name: string; type: string }[],
  datasetName?: string | null
): { title: string; sql: string }[] {
  if (columns.length === 0) return [];

  const tableName = datasetName
    ? datasetName.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
    : 'customers';

  const numericCols = columns.filter(c => c.type === 'integer' || c.type === 'decimal');
  const categoricalCols = columns.filter(c => c.type === 'string' && !c.name.toLowerCase().includes('id'));
  const dateCols = columns.filter(c => c.type === 'date' || c.type === 'datetime');

  const suggestions: { title: string; sql: string }[] = [
    {
      title: `Preview First 25 Rows (${tableName})`,
      sql: `SELECT *\nFROM ${tableName}\nLIMIT 25;`
    }
  ];

  if (categoricalCols.length > 0 && numericCols.length > 0) {
    const cat = categoricalCols[0].name;
    const num = numericCols[0].name;
    suggestions.push({
      title: `Top 5 ${cat} (Pie Chart Ready)`,
      sql: `SELECT \n  ${cat},\n  ROUND(SUM(${num}), 2) AS total_${num}\nFROM ${tableName}\nGROUP BY ${cat}\nORDER BY total_${num} DESC\nLIMIT 5;`
    });

    suggestions.push({
      title: `Aggregate ${num} by ${cat}`,
      sql: `SELECT \n  ${cat},\n  COUNT(*) AS total_records,\n  ROUND(AVG(${num}), 2) AS avg_${num},\n  ROUND(SUM(${num}), 2) AS total_${num}\nFROM ${tableName}\nGROUP BY ${cat}\nORDER BY total_${num} DESC;`
    });
  }

  if (categoricalCols.length > 0) {
    const cat = categoricalCols[0].name;
    suggestions.push({
      title: `Value Distribution for ${cat}`,
      sql: `SELECT \n  ${cat},\n  COUNT(*) AS count,\n  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${tableName}), 1) AS pct_share\nFROM ${tableName}\nGROUP BY ${cat}\nORDER BY count DESC;`
    });
  }

  if (numericCols.length >= 2) {
    const n1 = numericCols[0].name;
    const n2 = numericCols[1].name;
    suggestions.push({
      title: `Filter Above Average (${n1} & ${n2})`,
      sql: `SELECT *\nFROM ${tableName}\nWHERE ${n1} > (SELECT AVG(${n1}) FROM ${tableName})\nORDER BY ${n2} DESC\nLIMIT 50;`
    });
  }

  if (dateCols.length > 0 && numericCols.length > 0) {
    const dt = dateCols[0].name;
    const num = numericCols[0].name;
    suggestions.push({
      title: `Timeline Trend (${num} over ${dt})`,
      sql: `SELECT \n  ${dt},\n  COUNT(*) as record_count,\n  ROUND(SUM(${num}), 2) as daily_${num}\nFROM ${tableName}\nGROUP BY ${dt}\nORDER BY ${dt} ASC;`
    });
  }

  suggestions.push({
    title: 'Show All Tables',
    sql: 'SHOW TABLES;'
  });

  return suggestions;
}
