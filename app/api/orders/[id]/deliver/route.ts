import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-api";
import sql from "mssql";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await (context.params as Promise<{ id: string }>);

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Only admins can mark delivered" }, { status: 403 });
    }

    const pool = await getConnection();

    // Check delivered_at column
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' 
        AND COLUMN_NAME IN ('delivered_at')
    `);
    const columnNames = new Set(columnsCheck.recordset.map((r: any) => r.COLUMN_NAME));
    const hasDeliveredAt = columnNames.has("delivered_at");

    // Verify order exists and is purchase
    const orderCheck = await pool
      .request()
      .input("order_id", sql.UniqueIdentifier, id)
      .query(`
        SELECT id, type, status
        FROM orders
        WHERE id = @order_id
      `);

    if (orderCheck.recordset.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderCheck.recordset[0];
    if (order.type !== "purchase") {
      return NextResponse.json({ error: "Only purchase orders can be marked delivered" }, { status: 400 });
    }

    // Update order to delivered
    const updateReq = pool.request();
    updateReq.input("order_id", sql.UniqueIdentifier, id);

    const sets: string[] = ["status = 'delivered'", "updated_at = GETDATE()"];
    if (hasDeliveredAt) sets.push("delivered_at = GETDATE()");

    await updateReq.query(`
      UPDATE orders
      SET ${sets.join(",\n          ")}
      WHERE id = @order_id
    `);

    // Fetch updated order
    const updatedOrder = await pool
      .request()
      .input("order_id", sql.UniqueIdentifier, id)
      .query(`SELECT * FROM orders WHERE id = @order_id`);

    return NextResponse.json({
      success: true,
      message: "Order marked as delivered",
      order: updatedOrder.recordset[0],
    });
  } catch (error: any) {
    console.error("Deliver error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

