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
      return NextResponse.json({ error: "Forbidden - Only admins can dispatch orders" }, { status: 403 });
    }

    const body = await request.json();
    const carrier = body?.shippingCarrier || body?.carrier || null;
    const trackingNumber = body?.trackingNumber || body?.tracking || null;
    const trackingUrl = body?.trackingUrl || null;

    const pool = await getConnection();

    // Check tracking columns
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' 
        AND COLUMN_NAME IN ('shipping_carrier','tracking_number','tracking_url','shipped_at','delivered_at')
    `);
    const columnNames = new Set(columnsCheck.recordset.map((r: any) => r.COLUMN_NAME));
    const hasShippingCarrier = columnNames.has("shipping_carrier");
    const hasTrackingNumber = columnNames.has("tracking_number");
    const hasTrackingUrl = columnNames.has("tracking_url");
    const hasShippedAt = columnNames.has("shipped_at");

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
      return NextResponse.json({ error: "Only purchase orders can be dispatched" }, { status: 400 });
    }

    // Update order to shipped
    const updateReq = pool.request();
    updateReq.input("order_id", sql.UniqueIdentifier, id);
    updateReq.input("updated_by", sql.NVarChar, user.username);
    if (hasShippingCarrier) updateReq.input("shipping_carrier", sql.NVarChar, carrier);
    if (hasTrackingNumber) updateReq.input("tracking_number", sql.NVarChar, trackingNumber);
    if (hasTrackingUrl) updateReq.input("tracking_url", sql.NVarChar, trackingUrl);

    const sets: string[] = ["status = 'shipped'", "updated_at = GETDATE()"];
    if (hasShippingCarrier) sets.push("shipping_carrier = @shipping_carrier");
    if (hasTrackingNumber) sets.push("tracking_number = @tracking_number");
    if (hasTrackingUrl) sets.push("tracking_url = @tracking_url");
    if (hasShippedAt) sets.push("shipped_at = GETDATE()");

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
      message: "Order marked as shipped",
      order: updatedOrder.recordset[0],
    });
  } catch (error: any) {
    console.error("Dispatch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

