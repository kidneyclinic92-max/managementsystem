import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-api";
import sql from 'mssql';

// POST /api/orders/[id]/approve - Approve a purchase order
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // In Next.js app router, params may be a Promise; unwrap to avoid runtime error.
    const { id } = await (context.params as Promise<{ id: string }>);

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Only admins can approve orders" }, { status: 403 });
    }

    const pool = await getConnection();
    const request_query = pool.request();

    // Check if approval columns exist
    const approvalColumnCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'approval_status'
    `);
    const hasApprovalColumns = approvalColumnCheck.recordset.length > 0;

    // Check if order exists and is a purchase order
    const orderCheck = await request_query
      .input('order_id', sql.UniqueIdentifier, id)
      .query(`
        SELECT id, type, ${hasApprovalColumns ? "approval_status" : "NULL AS approval_status"}, status
        FROM orders
        WHERE id = @order_id
      `);

    if (orderCheck.recordset.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderCheck.recordset[0];
    
    if (order.type !== 'purchase') {
      return NextResponse.json({ error: "Only purchase orders can be approved" }, { status: 400 });
    }

    if (hasApprovalColumns && order.approval_status === 'approved') {
      return NextResponse.json({ error: "Order is already approved" }, { status: 400 });
    }

    // Approve the order (handle schema with or without approval columns)
    const approveRequest = pool.request();
    if (hasApprovalColumns) {
      await approveRequest
        .input('order_id', sql.UniqueIdentifier, id)
        .input('approved_by', sql.NVarChar, user.username)
        .query(`
          UPDATE orders 
          SET approval_status = 'approved',
              approved_by = @approved_by,
              approved_at = GETDATE(),
              status = 'processing',
              updated_at = GETDATE()
          WHERE id = @order_id
        `);
    } else {
      await approveRequest
        .input('order_id', sql.UniqueIdentifier, id)
        .input('approved_by', sql.NVarChar, user.username)
        .query(`
          UPDATE orders 
          SET status = 'processing',
              updated_at = GETDATE()
          WHERE id = @order_id
        `);
    }

    // Fetch updated order
    const updatedOrder = await pool.request()
      .input('order_id', sql.UniqueIdentifier, id)
      .query(`
        SELECT * FROM orders WHERE id = @order_id
      `);

    return NextResponse.json({ 
      success: true,
      message: "Order approved successfully",
      order: updatedOrder.recordset[0]
    });
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

