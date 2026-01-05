import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";
import sql from 'mssql';

// POST /api/import-data - Import inventory data from JSON
export async function POST(request: Request) {
  try {
    // Authentication & authorization
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { inventory } = body;

    if (!inventory || !Array.isArray(inventory)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected { inventory: [...] }" },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request_query = new sql.Request(transaction);
      const importedItems = [];
      const errors = [];

      for (const item of inventory) {
        try {
          // Get or create category
          let categoryId = null;
          if (item.category) {
            const categoryResult = await request_query
              .input('categoryName', sql.NVarChar, item.category)
              .query(`
                SELECT id FROM categories WHERE name = @categoryName
              `);

            if (categoryResult.recordset.length > 0) {
              categoryId = categoryResult.recordset[0].id;
            } else {
              // Create new category
              const newCategoryResult = await request_query
                .input('categoryName', sql.NVarChar, item.category)
                .query(`
                  INSERT INTO categories (name)
                  OUTPUT INSERTED.id
                  VALUES (@categoryName)
                `);
              categoryId = newCategoryResult.recordset[0].id;
            }
          }

          // Check if item with this SKU already exists
          const existingResult = await request_query
            .input('sku', sql.NVarChar, item.sku)
            .query(`
              SELECT id FROM inventory_items WHERE sku = @sku
            `);

          if (existingResult.recordset.length > 0) {
            // Update existing item
            const updateResult = await request_query
              .input('id', sql.UniqueIdentifier, existingResult.recordset[0].id)
              .input('name', sql.NVarChar, item.name)
              .input('barcode', sql.NVarChar, item.barcode || null)
              .input('category_id', sql.UniqueIdentifier, categoryId)
              .input('quantity', sql.Int, item.quantity || 0)
              .input('price', sql.Decimal(10, 2), item.price)
              .input('cost', sql.Decimal(10, 2), item.cost || item.price * 0.75)
              .input('supplier', sql.NVarChar, item.supplier || '')
              .input('location', sql.NVarChar, item.location || '')
              .input('description', sql.NVarChar, item.description || null)
              .input('min_stock', sql.Int, item.minStock || 0)
              .input('max_stock', sql.Int, item.maxStock || 0)
              .input('reorder_point', sql.Int, item.reorderPoint || item.minStock || 0)
              .input('reorder_quantity', sql.Int, item.reorderQuantity || item.maxStock || 0)
              .input('age_restricted', sql.Bit, item.ageRestricted || false)
              .input('min_age', sql.Int, item.minAge || null)
              .input('requires_id', sql.Bit, item.requiresId || false)
              .input('compliance_notes', sql.NVarChar, item.complianceNotes || null)
              .input('updated_by', sql.NVarChar, user.username)
              .query(`
                UPDATE inventory_items 
                SET name = @name,
                    barcode = @barcode,
                    category_id = @category_id,
                    quantity = @quantity,
                    price = @price,
                    cost = @cost,
                    supplier = @supplier,
                    location = @location,
                    description = @description,
                    min_stock = @min_stock,
                    max_stock = @max_stock,
                    reorder_point = @reorder_point,
                    reorder_quantity = @reorder_quantity,
                    age_restricted = @age_restricted,
                    min_age = @min_age,
                    requires_id = @requires_id,
                    compliance_notes = @compliance_notes,
                    updated_by = @updated_by,
                    updated_at = GETDATE()
                WHERE id = @id
              `);
            
            importedItems.push({ sku: item.sku, action: 'updated' });
          } else {
            // Insert new item
            const insertResult = await request_query
              .input('name', sql.NVarChar, item.name)
              .input('sku', sql.NVarChar, item.sku)
              .input('barcode', sql.NVarChar, item.barcode || null)
              .input('category_id', sql.UniqueIdentifier, categoryId)
              .input('quantity', sql.Int, item.quantity || 0)
              .input('price', sql.Decimal(10, 2), item.price)
              .input('cost', sql.Decimal(10, 2), item.cost || item.price * 0.75)
              .input('supplier', sql.NVarChar, item.supplier || '')
              .input('location', sql.NVarChar, item.location || '')
              .input('description', sql.NVarChar, item.description || null)
              .input('min_stock', sql.Int, item.minStock || 0)
              .input('max_stock', sql.Int, item.maxStock || 0)
              .input('reorder_point', sql.Int, item.reorderPoint || item.minStock || 0)
              .input('reorder_quantity', sql.Int, item.reorderQuantity || item.maxStock || 0)
              .input('age_restricted', sql.Bit, item.ageRestricted || false)
              .input('min_age', sql.Int, item.minAge || null)
              .input('requires_id', sql.Bit, item.requiresId || false)
              .input('compliance_notes', sql.NVarChar, item.complianceNotes || null)
              .input('created_by', sql.NVarChar, user.username)
              .query(`
                INSERT INTO inventory_items 
                (name, sku, barcode, category_id, quantity, price, cost, 
                 supplier, location, description, min_stock, max_stock,
                 reorder_point, reorder_quantity, age_restricted, min_age, 
                 requires_id, compliance_notes, created_by)
                OUTPUT INSERTED.id
                VALUES 
                (@name, @sku, @barcode, @category_id, @quantity, @price, @cost,
                 @supplier, @location, @description, @min_stock, @max_stock,
                 @reorder_point, @reorder_quantity, @age_restricted, @min_age,
                 @requires_id, @compliance_notes, @created_by)
              `);
            
            importedItems.push({ sku: item.sku, action: 'created' });
          }
        } catch (itemError: any) {
          errors.push({
            sku: item.sku || 'unknown',
            error: itemError.message
          });
        }
      }

      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: `Imported ${importedItems.length} items successfully`,
        imported: importedItems,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: "Import failed", details: error.message },
      { status: 500 }
    );
  }
}

