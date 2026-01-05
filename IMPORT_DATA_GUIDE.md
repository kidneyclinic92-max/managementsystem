# 📥 How to Import Your Inventory Data

## The Problem

You have inventory data in JSON format (or localStorage), but it's not showing up in the inventory page because:
- The data needs to be imported into the Azure SQL Database
- The database tables must exist first (run `database/schema.sql`)

## Step 1: Verify Tables Exist

First, make sure your database tables are created:

1. Visit: `http://localhost:3000/api/check-tables`
2. You should see: `"allTablesExist": true` and `"tableCount": 7`

If not, follow `STEP_BY_STEP_CREATE_TABLES.md` to create the tables first.

## Step 2: Import Your Data

### Option A: Using the API Endpoint (Recommended)

1. **Prepare your JSON data** in this format:
   ```json
   {
     "inventory": [
       {
         "name": "Laptop Computer",
         "sku": "LAP-001",
         "barcode": "1234567890123",
         "category": "Electronics",
         "quantity": 25,
         "price": 999.99,
         "cost": 750,
         "supplier": "TechCorp Inc.",
         "location": "Warehouse A - Shelf 1",
         "description": "High-performance laptop",
         "minStock": 10,
         "maxStock": 100,
         "ageRestricted": false,
         "requiresId": false
       }
     ]
   }
   ```

2. **Use a tool to send POST request:**
   
   **Using curl (Command Line):**
   ```bash
   curl -X POST http://localhost:3000/api/import-data \
     -H "Content-Type: application/json" \
     -H "Cookie: auth_token=YOUR_TOKEN" \
     -d @your-data.json
   ```
   
   **Using Postman:**
   - Method: POST
   - URL: `http://localhost:3000/api/import-data`
   - Headers: 
     - `Content-Type: application/json`
     - `Cookie: auth_token=YOUR_TOKEN` (get this from browser DevTools)
   - Body: Paste your JSON data
   
   **Using Browser Console:**
   ```javascript
   // First, get your auth token from browser cookies
   const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
   
   // Then import
   fetch('/api/import-data', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Cookie': `auth_token=${token}`
     },
     credentials: 'include',
     body: JSON.stringify({
       inventory: [
         {
           "name": "Laptop Computer",
           "sku": "LAP-001",
           "barcode": "1234567890123",
           "category": "Electronics",
           "quantity": 25,
           "price": 999.99,
           "cost": 750,
           "supplier": "TechCorp Inc.",
           "location": "Warehouse A - Shelf 1",
           "description": "High-performance laptop",
           "minStock": 10,
           "maxStock": 100,
           "ageRestricted": false,
           "requiresId": false
         }
         // ... add more items
       ]
     })
   })
   .then(res => res.json())
   .then(data => console.log('Import result:', data));
   ```

### Option B: Create an Import Page (Easier)

I can create a simple import page where you can paste your JSON and click a button. Would you like me to create that?

## Step 3: Verify Import

After importing:

1. Visit: `http://localhost:3000/inventory`
2. Your items should now appear!
3. Or check via API: `http://localhost:3000/api/inventory`

## Data Format Requirements

Your JSON data should match this structure:

```typescript
{
  inventory: [
    {
      name: string;           // Required
      sku: string;            // Required, must be unique
      barcode?: string;        // Optional
      category: string;        // Will create category if doesn't exist
      quantity: number;        // Default: 0
      price: number;           // Required
      cost?: number;           // Optional, defaults to price * 0.75
      supplier?: string;        // Optional
      location?: string;        // Optional
      description?: string;    // Optional
      minStock?: number;       // Default: 0
      maxStock?: number;       // Default: 0
      reorderPoint?: number;   // Default: minStock
      reorderQuantity?: number; // Default: maxStock
      ageRestricted?: boolean; // Default: false
      minAge?: number;         // Optional
      requiresId?: boolean;    // Default: false
      complianceNotes?: string; // Optional
    }
  ]
}
```

## Notes

- **SKU must be unique**: If an item with the same SKU exists, it will be updated instead of creating a duplicate
- **Categories are auto-created**: If a category doesn't exist, it will be created automatically
- **Admin only**: Only admin users can import data
- **Transaction safety**: All items are imported in a transaction - if one fails, all are rolled back

## Troubleshooting

### "Unauthorized" error
- Make sure you're logged in as admin
- Check that your auth token is valid

### "Forbidden" error
- Only admin users can import
- Make sure you're logged in as admin (not staff)

### "Invalid data format" error
- Make sure your JSON has an `inventory` array
- Check that required fields (name, sku, price) are present

### Items not showing after import
- Refresh the inventory page
- Check browser console for errors
- Verify tables exist: `http://localhost:3000/api/check-tables`

