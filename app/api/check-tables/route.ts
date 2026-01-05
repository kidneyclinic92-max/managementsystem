import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import sql from 'mssql';

// Diagnostic endpoint to check if tables exist
export async function GET() {
  try {
    const pool = await getConnection();
    
    // First, check what database we're connected to
    const dbResult = await pool.request().query('SELECT DB_NAME() as current_database');
    const currentDb = dbResult.recordset[0]?.current_database;
    
    // List all tables
    const tablesResult = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    const tables = tablesResult.recordset.map((row: any) => ({
      schema: row.TABLE_SCHEMA,
      name: row.TABLE_NAME,
      type: row.TABLE_TYPE,
    }));
    
    // Check for required tables
    const requiredTables = [
      'categories',
      'inventory_items',
      'orders',
      'order_items',
      'cycle_counts',
      'audit_logs',
      'replenishment_requests'
    ];
    
    const existingTableNames = tables.map(t => t.name.toLowerCase());
    const missingTables = requiredTables.filter(
      req => !existingTableNames.includes(req.toLowerCase())
    );
    
    // Try to query inventory_items to see the exact error
    let inventoryTest = { success: false, error: null as string | null };
    try {
      const testResult = await pool.request().query('SELECT TOP 1 * FROM inventory_items');
      inventoryTest.success = true;
    } catch (testError: any) {
      inventoryTest.error = testError.message;
    }
    
    return NextResponse.json({
      success: true,
      database: currentDb,
      tables: tables,
      tableCount: tables.length,
      requiredTables: requiredTables,
      missingTables: missingTables,
      allTablesExist: missingTables.length === 0,
      inventoryTest: inventoryTest,
      message: missingTables.length === 0 
        ? "All required tables exist!" 
        : `Missing tables: ${missingTables.join(', ')}`
    });
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }, { status: 500 });
  }
}

