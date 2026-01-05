import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-api";
import sql from 'mssql';

// GET /api/orders - Get all orders
export async function GET(request: Request) {
  try {
    // Authentication (supports both cookie and Bearer token)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const pool = await getConnection();
    // Check if approval and tracking columns exist (for GET response)
    const columnsCheckGet = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders'
        AND COLUMN_NAME IN (
          'approval_status','approved_by','approved_at','rejected_by','rejected_at','rejection_reason',
          'shipping_carrier','tracking_number','tracking_url','shipped_at','delivered_at'
        )
    `);
    const columnNamesGet = new Set(columnsCheckGet.recordset.map((r: any) => r.COLUMN_NAME));
    const hasApprovalColumnsGet = columnNamesGet.has('approval_status');
    const hasShippingCarrier = columnNamesGet.has('shipping_carrier');
    const hasTrackingNumber = columnNamesGet.has('tracking_number');
    const hasTrackingUrl = columnNamesGet.has('tracking_url');
    const hasShippedAt = columnNamesGet.has('shipped_at');
    const hasDeliveredAt = columnNamesGet.has('delivered_at');
    const hasAnyTracking =
      hasShippingCarrier || hasTrackingNumber || hasTrackingUrl || hasShippedAt || hasDeliveredAt;
    
    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.type,
        o.status,
        o.customer,
        o.supplier,
        o.shipping_address,
        o.picking_status,
        o.packing_status,
        o.picked_by,
        o.packed_by,
        o.shipped_at,
        o.total,
        o.notes,
        o.created_at,
        o.updated_at,
        o.created_by
    `;
    
    if (hasApprovalColumnsGet) {
      query += `,
        o.approval_status,
        o.approved_by,
        o.approved_at,
        o.rejected_by,
        o.rejected_at,
        o.rejection_reason`;
    }

    if (hasAnyTracking) {
      query += `,
        ${hasShippingCarrier ? 'o.shipping_carrier,' : ''}
        ${hasTrackingNumber ? 'o.tracking_number,' : ''}
        ${hasTrackingUrl ? 'o.tracking_url,' : ''}
        ${hasShippedAt ? 'o.shipped_at,' : ''}
        ${hasDeliveredAt ? 'o.delivered_at,' : ''}
        1 as _tracking_placeholder`;
    }
    
    query += `
      FROM orders o
      WHERE 1=1
    `;

    const request_query = pool.request();

    // Vendors should only see their own orders
    if (user.role === "vendor") {
      query += ` AND o.created_by = @created_by`;
      request_query.input('created_by', sql.NVarChar, user.username);
    }

    if (type) {
      query += ` AND o.type = @type`;
      request_query.input('type', sql.NVarChar, type);
    }

    if (status) {
      query += ` AND o.status = @status`;
      request_query.input('status', sql.NVarChar, status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const ordersResult = await request_query.query(query);

    // Get order items for each order
    const safeIso = (value: any) => {
      if (!value) return undefined;
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const orders = await Promise.all(
      ordersResult.recordset.map(async (row: any) => {
        const itemsResult = await pool.request()
          .input('order_id', sql.UniqueIdentifier, row.id)
          .query(`
            SELECT 
              oi.id,
              oi.item_id,
              oi.item_name,
              oi.quantity,
              oi.picked_quantity,
              oi.packed_quantity,
              oi.price,
              oi.subtotal,
              oi.bin
            FROM order_items oi
            WHERE oi.order_id = @order_id
          `);

        return {
          id: row.id,
          orderNumber: row.order_number,
          type: row.type,
          status: row.status,
          customer: row.customer,
          supplier: row.supplier,
          shippingAddress: row.shipping_address,
          pickingStatus: row.picking_status || undefined,
          packingStatus: row.packing_status || undefined,
          pickedBy: row.picked_by || undefined,
          packedBy: row.packed_by || undefined,
          shippedAt: hasShippedAt ? safeIso(row.shipped_at) : undefined,
          total: parseFloat(row.total),
          notes: row.notes || undefined,
          items: itemsResult.recordset.map((item: any) => ({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            quantity: item.quantity,
            pickedQuantity: item.picked_quantity || 0,
            packedQuantity: item.packed_quantity || 0,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.subtotal),
            bin: item.bin || undefined,
          })),
          createdAt: safeIso(row.created_at) || new Date().toISOString(),
          updatedAt: safeIso(row.updated_at) || safeIso(row.created_at) || new Date().toISOString(),
          createdBy: row.created_by || undefined,
          ...(hasApprovalColumnsGet ? {
            approvalStatus: row.approval_status || undefined,
            approvedBy: row.approved_by || undefined,
            approvedAt: safeIso(row.approved_at),
            rejectedBy: row.rejected_by || undefined,
            rejectedAt: safeIso(row.rejected_at),
            rejectionReason: row.rejection_reason || undefined,
          } : {}),
          ...(hasAnyTracking ? {
            shippingCarrier: hasShippingCarrier ? row.shipping_carrier || undefined : undefined,
            trackingNumber: hasTrackingNumber ? row.tracking_number || undefined : undefined,
            trackingUrl: hasTrackingUrl ? row.tracking_url || undefined : undefined,
            shippedAt: hasShippedAt ? safeIso(row.shipped_at) : undefined,
            deliveredAt: hasDeliveredAt ? safeIso(row.delivered_at) : undefined,
          } : {}),
        };
      })
    );

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: Request) {
  try {
    // Authentication (supports both cookie and Bearer token)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request_query = new sql.Request(transaction);

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Calculate total
      const total = body.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // Check if approval_status column exists
      const approvalColumnCheckInsert = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'approval_status'
      `);
      
      const hasApprovalColumnsInsert = approvalColumnCheckInsert.recordset.length > 0;
      
      // Determine approval status: Purchase orders need approval, sales don't
      const approvalStatus = body.type === 'purchase' ? 'pending_approval' : 'approved';
      const initialStatus = body.type === 'purchase' ? 'pending' : (body.status || 'pending');

      // Insert order - conditionally include approval_status if column exists
      let insertQuery: string;
      let orderResult: any;
      
      if (hasApprovalColumnsInsert) {
        orderResult = await request_query
          .input('order_number', sql.NVarChar, orderNumber)
          .input('type', sql.NVarChar, body.type)
          .input('status', sql.NVarChar, initialStatus)
          .input('customer', sql.NVarChar, body.customer || null)
          .input('supplier', sql.NVarChar, body.supplier || null)
          .input('shipping_address', sql.NVarChar, body.shippingAddress || null)
          .input('total', sql.Decimal(10, 2), total)
          .input('notes', sql.NVarChar, body.notes || null)
          .input('created_by', sql.NVarChar, user.username)
          .input('approval_status', sql.NVarChar, approvalStatus)
          .query(`
            INSERT INTO orders 
            (order_number, type, status, customer, supplier, shipping_address, total, notes, created_by, approval_status)
            OUTPUT INSERTED.*
            VALUES 
            (@order_number, @type, @status, @customer, @supplier, @shipping_address, @total, @notes, @created_by, @approval_status)
          `);
      } else {
        // Fallback: insert without approval_status column
        orderResult = await request_query
          .input('order_number', sql.NVarChar, orderNumber)
          .input('type', sql.NVarChar, body.type)
          .input('status', sql.NVarChar, initialStatus)
          .input('customer', sql.NVarChar, body.customer || null)
          .input('supplier', sql.NVarChar, body.supplier || null)
          .input('shipping_address', sql.NVarChar, body.shippingAddress || null)
          .input('total', sql.Decimal(10, 2), total)
          .input('notes', sql.NVarChar, body.notes || null)
          .input('created_by', sql.NVarChar, user.username)
          .query(`
            INSERT INTO orders 
            (order_number, type, status, customer, supplier, shipping_address, total, notes, created_by)
            OUTPUT INSERTED.*
            VALUES 
            (@order_number, @type, @status, @customer, @supplier, @shipping_address, @total, @notes, @created_by)
          `);
      }

      const orderId = orderResult.recordset[0].id;

      // Insert order items
      for (const item of body.items) {
        // Use separate request for each order item
        const itemRequest = new sql.Request(transaction);
        await itemRequest
          .input('order_id', sql.UniqueIdentifier, orderId)
          .input('item_id', sql.UniqueIdentifier, item.itemId)
          .input('item_name', sql.NVarChar, item.itemName)
          .input('quantity', sql.Int, item.quantity)
          .input('price', sql.Decimal(10, 2), item.price)
          .input('subtotal', sql.Decimal(10, 2), item.price * item.quantity)
          .input('bin', sql.NVarChar, item.bin || null)
          .query(`
            INSERT INTO order_items 
            (order_id, item_id, item_name, quantity, price, subtotal, bin)
            VALUES 
            (@order_id, @item_id, @item_name, @quantity, @price, @subtotal, @bin)
          `);

        // Update inventory quantities - use separate request
        if (body.type === 'sale') {
          // Decrease inventory for sales
          const updateRequest = new sql.Request(transaction);
          await updateRequest
            .input('item_id', sql.UniqueIdentifier, item.itemId)
            .input('quantity', sql.Int, item.quantity)
            .query(`
              UPDATE inventory_items 
              SET quantity = quantity - @quantity,
                  updated_at = GETDATE()
              WHERE id = @item_id
            `);
        } else if (body.type === 'purchase') {
          // Increase inventory for purchases
          const updateRequest = new sql.Request(transaction);
          await updateRequest
            .input('item_id', sql.UniqueIdentifier, item.itemId)
            .input('quantity', sql.Int, item.quantity)
            .query(`
              UPDATE inventory_items 
              SET quantity = quantity + @quantity,
                  updated_at = GETDATE()
              WHERE id = @item_id
            `);
        }
      }

      await transaction.commit();

      // Check if approval columns exist (for POST response)
      const approvalColumnCheckPost = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'approval_status'
      `);
      const hasApprovalColumnsPost = approvalColumnCheckPost.recordset.length > 0;
      
      // Build query based on whether approval columns exist
      let orderQuery = `
        SELECT 
          o.id,
          o.order_number,
          o.type,
          o.status,
          o.customer,
          o.supplier,
          o.shipping_address,
          o.picking_status,
          o.packing_status,
          o.picked_by,
          o.packed_by,
          o.shipped_at,
          o.total,
          o.notes,
          o.created_at,
          o.updated_at,
          o.created_by`;
      
      if (hasApprovalColumnsPost) {
        orderQuery += `,
          o.approval_status,
          o.approved_by,
          o.approved_at,
          o.rejected_by,
          o.rejected_at,
          o.rejection_reason`;
      }
      
      orderQuery += `,
          (SELECT 
            oi.id, oi.item_id, oi.item_name, oi.quantity, oi.picked_quantity, 
            oi.packed_quantity, oi.price, oi.subtotal, oi.bin
           FROM order_items oi
           WHERE oi.order_id = o.id
           FOR JSON PATH) as items_json
        FROM orders o
        WHERE o.id = @order_id
      `;
      
      // Fetch complete order with items
      const completeOrderResult = await pool.request()
        .input('order_id', sql.UniqueIdentifier, orderId)
        .query(orderQuery);

      const row = completeOrderResult.recordset[0];
      const items = JSON.parse(row.items_json || '[]');

      const order = {
        id: row.id,
        orderNumber: row.order_number,
        type: row.type,
        status: row.status,
        customer: row.customer,
        supplier: row.supplier,
        shippingAddress: row.shipping_address,
        pickingStatus: row.picking_status || undefined,
        packingStatus: row.packing_status || undefined,
        pickedBy: row.picked_by || undefined,
        packedBy: row.packed_by || undefined,
        shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : undefined,
        total: parseFloat(row.total),
        notes: row.notes || undefined,
        items: items.map((item: any) => ({
          id: item.id,
          itemId: item.item_id,
          itemName: item.item_name,
          quantity: item.quantity,
          pickedQuantity: item.picked_quantity || 0,
          packedQuantity: item.packed_quantity || 0,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal),
          bin: item.bin || undefined,
        })),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        createdBy: row.created_by || undefined,
        ...(hasApprovalColumnsPost ? {
          approvalStatus: row.approval_status || undefined,
          approvedBy: row.approved_by || undefined,
          approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
          rejectedBy: row.rejected_by || undefined,
          rejectedAt: row.rejected_at ? new Date(row.rejected_at).toISOString() : undefined,
          rejectionReason: row.rejection_reason || undefined,
        } : {}),
      };

      return NextResponse.json({ order });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Database error:', error);
    
    // Provide more specific error messages
    let errorMessage = "Internal server error";
    let errorDetails = error.message || "Unknown error";
    
    // Check for common SQL errors
    if (error.message?.includes("parameter name") && error.message?.includes("already been declared")) {
      errorMessage = "Database parameter error";
      errorDetails = "A parameter name conflict occurred. This is a system error.";
    } else if (error.message?.includes("FOREIGN KEY constraint") ||
               error.message?.includes("The INSERT statement conflicted")) {
      errorMessage = "Invalid item reference";
      errorDetails = "One or more items in the order don't exist in inventory.";
    } else if (error.message?.includes("NOT NULL") ||
               error.message?.includes("cannot be null")) {
      errorMessage = "Missing required field";
      errorDetails = "One or more required fields are missing.";
    } else if (error.message?.includes("String or binary data would be truncated")) {
      errorMessage = "Data too long";
      errorDetails = "One of the fields exceeds the maximum length allowed.";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        fullError: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
