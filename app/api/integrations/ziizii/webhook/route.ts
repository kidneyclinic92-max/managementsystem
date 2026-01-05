import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import sql from 'mssql';

// POST /api/integrations/ziizii/webhook - Receive orders from ZiiZii
export async function POST(request: Request) {
  try {
    // Verify API key (add to .env.local)
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization");
    const expectedApiKey = process.env.ZIIZII_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Log incoming webhook for debugging
    console.log("ZiiZii webhook received:", JSON.stringify(body, null, 2));

    // Parse ZiiZii order format (adjust based on actual ZiiZii format)
    // This is a placeholder - you'll need to adjust based on actual ZiiZii API response
    const ziiziiOrder = body.order || body; // Handle different formats
    
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request_query = new sql.Request(transaction);

      // Generate order number (or use ZiiZii's order number)
      const orderNumber = ziiziiOrder.order_number || ziiziiOrder.orderNumber || `ZII-${Date.now()}`;
      
      // Check if order already exists (prevent duplicates) - use separate request
      const duplicateCheckRequest = new sql.Request(transaction);
      const existingOrder = await duplicateCheckRequest
        .input('order_number', sql.NVarChar, orderNumber)
        .query(`
          SELECT id FROM orders WHERE order_number = @order_number
        `);

      if (existingOrder.recordset.length > 0) {
        await transaction.rollback();
        return NextResponse.json({
          success: true,
          message: "Order already exists",
          orderId: existingOrder.recordset[0].id
        });
      }

      // Calculate total from items
      const items = ziiziiOrder.items || ziiziiOrder.order_items || [];
      const total = items.reduce(
        (sum: number, item: any) => sum + (item.price || item.unit_price || 0) * (item.quantity || 0),
        0
      );

      // Check if approval columns exist
      const approvalColumnCheck = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'approval_status'
      `);
      const hasApprovalColumns = approvalColumnCheck.recordset.length > 0;

      // Insert order
      let orderResult: any;
      if (hasApprovalColumns) {
        // Purchase orders from vendors need approval
        orderResult = await request_query
          .input('order_number', sql.NVarChar, orderNumber)
          .input('type', sql.NVarChar, 'purchase')
          .input('status', sql.NVarChar, 'pending')
          .input('supplier', sql.NVarChar, ziiziiOrder.vendor || ziiziiOrder.supplier || 'ZiiZii Vendor')
          .input('total', sql.Decimal(10, 2), total)
          .input('notes', sql.NVarChar, `Order from ZiiZii - ${ziiziiOrder.vendor || 'Vendor'}`)
          .input('created_by', sql.NVarChar, 'ziizii_integration')
          .input('approval_status', sql.NVarChar, 'pending_approval')
          .query(`
            INSERT INTO orders 
            (order_number, type, status, supplier, total, notes, created_by, approval_status)
            OUTPUT INSERTED.*
            VALUES 
            (@order_number, @type, @status, @supplier, @total, @notes, @created_by, @approval_status)
          `);
      } else {
        orderResult = await request_query
          .input('order_number', sql.NVarChar, orderNumber)
          .input('type', sql.NVarChar, 'purchase')
          .input('status', sql.NVarChar, 'pending')
          .input('supplier', sql.NVarChar, ziiziiOrder.vendor || ziiziiOrder.supplier || 'ZiiZii Vendor')
          .input('total', sql.Decimal(10, 2), total)
          .input('notes', sql.NVarChar, `Order from ZiiZii - ${ziiziiOrder.vendor || 'Vendor'}`)
          .input('created_by', sql.NVarChar, 'ziizii_integration')
          .query(`
            INSERT INTO orders 
            (order_number, type, status, supplier, total, notes, created_by)
            OUTPUT INSERTED.*
            VALUES 
            (@order_number, @type, @status, @supplier, @total, @notes, @created_by)
          `);
      }

      const orderId = orderResult.recordset[0].id;

      // Insert order items
      for (const item of items) {
        // Try to find item by SKU or barcode
        const itemRequest = new sql.Request(transaction);
        const sku = item.sku || item.SKU || item.barcode || item.product_code;
        const itemName = item.name || item.product_name || item.description || 'Unknown Item';
        const quantity = item.quantity || item.qty || 1;
        const price = item.price || item.unit_price || item.cost || 0;

        // Find matching inventory item by SKU
        let inventoryItemId = null;
        if (sku) {
          const inventoryCheck = await itemRequest
            .input('sku', sql.NVarChar, sku)
            .query(`
              SELECT id FROM inventory_items WHERE sku = @sku OR barcode = @sku
            `);
          
          if (inventoryCheck.recordset.length > 0) {
            inventoryItemId = inventoryCheck.recordset[0].id;
          }
        }

        // Insert order item
        const orderItemRequest = new sql.Request(transaction);
        await orderItemRequest
          .input('order_id', sql.UniqueIdentifier, orderId)
          .input('item_id', sql.UniqueIdentifier, inventoryItemId)
          .input('item_name', sql.NVarChar, itemName)
          .input('quantity', sql.Int, quantity)
          .input('price', sql.Decimal(10, 2), price)
          .input('subtotal', sql.Decimal(10, 2), price * quantity)
          .query(`
            INSERT INTO order_items 
            (order_id, item_id, item_name, quantity, price, subtotal)
            VALUES 
            (@order_id, @item_id, @item_name, @quantity, @price, @subtotal)
          `);
      }

      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: "Order created successfully from ZiiZii",
        orderId: orderId,
        orderNumber: orderNumber
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('ZiiZii webhook error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process ZiiZii order",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET /api/integrations/ziizii/webhook - Test endpoint
export async function GET() {
  return NextResponse.json({
    message: "ZiiZii webhook endpoint is active",
    instructions: "Send POST requests to this endpoint with order data",
    format: {
      order_number: "string",
      vendor: "string",
      items: [
        {
          sku: "string",
          name: "string",
          quantity: "number",
          price: "number"
        }
      ]
    }
  });
}

