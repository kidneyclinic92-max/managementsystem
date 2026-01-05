# ✅ Step-by-Step: Create Database Tables

## Your Current Status
- ✅ Database connection: **WORKING**
- ✅ Connected to: `inventorymanagement`
- ❌ Tables: **0 tables found** (need to create 7 tables)

---

## Method 1: Azure Portal Query Editor (Easiest) ⭐

### Step 1: Open Azure Portal
1. Go to: https://portal.azure.com
2. Sign in with your Azure account

### Step 2: Navigate to Your Database
1. In the top search bar, type: **"SQL databases"**
2. Click on **"SQL databases"** from the results
3. Find and click on: **`inventorymanagement`**

### Step 3: Open Query Editor
1. In the left sidebar menu, click **"Query editor"**
2. You'll see a login prompt
3. Click **"Use SQL authentication"**
4. Enter:
   - **Username:** `admin101`
   - **Password:** (your Azure SQL password)
5. Click **"OK"**

### Step 4: Copy the Schema Script
1. Open the file: `database/schema.sql` in your project folder
2. **Select ALL** the text (Ctrl+A)
3. **Copy** it (Ctrl+C)

### Step 5: Paste and Run
1. In the Query Editor, **paste** the script (Ctrl+V)
2. Click the **"Run"** button (or press F5)
3. Wait for the message: ✅ **"Query succeeded"**

### Step 6: Verify Tables Created
1. In the Query Editor, run this query:
   ```sql
   SELECT TABLE_NAME 
   FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME;
   ```
2. You should see **7 tables**:
   - audit_logs
   - categories
   - cycle_counts
   - inventory_items
   - order_items
   - orders
   - replenishment_requests

### Step 7: Refresh Your App
1. Go back to your browser
2. Visit: `http://localhost:3000/api/check-tables`
3. You should now see: `"allTablesExist": true`
4. Refresh your inventory page - error should be gone! ✅

---

## Method 2: SQL Server Management Studio (SSMS)

### Step 1: Download SSMS (if needed)
- Download from: https://aka.ms/ssmsfullsetup
- Install it

### Step 2: Connect to Azure SQL
1. Open SQL Server Management Studio
2. In "Connect to Server" dialog:
   - **Server name:** `managementserver.database.windows.net`
   - **Authentication:** SQL Server Authentication
   - **Login:** `admin101`
   - **Password:** (your password)
   - Click **"Connect"**

### Step 3: Select Database
1. In Object Explorer, expand **"Databases"**
2. Right-click on **`inventorymanagement`**
3. Click **"New Query"**

### Step 4: Run Schema Script
1. Open `database/schema.sql` from your project
2. Copy all contents
3. Paste into the query window
4. Click **"Execute"** (F5)
5. Wait for: ✅ **"Command(s) completed successfully"**

### Step 5: Verify
- Run the verification query from Method 1, Step 6

---

## Method 3: Azure Data Studio

### Step 1: Download (if needed)
- Download from: https://aka.ms/azuredatastudio

### Step 2: Connect
1. Click **"New Connection"**
2. Enter:
   - **Server:** `managementserver.database.windows.net`
   - **Authentication:** SQL Login
   - **Username:** `admin101`
   - **Password:** (your password)
   - **Database:** `inventorymanagement`
3. Click **"Connect"**

### Step 3: Run Schema
1. Click **"New Query"**
2. Open `database/schema.sql`
3. Copy and paste into query window
4. Click **"Run"** (F5)

---

## Troubleshooting

### ❌ "Query succeeded" but tables still missing?
- **Check:** Make sure you're connected to the correct database (`inventorymanagement`)
- **Solution:** Run the verification query to confirm tables exist

### ❌ "Login failed" error?
- **Check:** Username is exactly `admin101` (case-sensitive)
- **Check:** Password is correct
- **Solution:** Try resetting password in Azure Portal if needed

### ❌ "Firewall" error?
- **Go to:** Azure Portal → SQL Server → Networking
- **Click:** "Add your client IPv4 address"
- **Save** and wait 1-2 minutes

### ❌ Script runs but shows errors?
- **Check:** Look for specific error messages in the results
- **Common issue:** Some tables might already exist (script uses IF NOT EXISTS, so this is OK)
- **Solution:** As long as you see "Query succeeded", tables should be created

---

## Quick Verification

After running the script, verify with:

```sql
-- Count tables
SELECT COUNT(*) as table_count
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- Should return: 7

-- List all tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

---

## What Gets Created?

The schema creates these 7 tables:

1. **categories** - Product categories
2. **inventory_items** - All inventory items (main table)
3. **orders** - Purchase and sales orders
4. **order_items** - Items in each order
5. **cycle_counts** - Physical inventory counts
6. **audit_logs** - Change tracking
7. **replenishment_requests** - Stock replenishment

Plus indexes for fast queries! 🚀

---

## After Creating Tables

1. ✅ Visit: `http://localhost:3000/api/check-tables`
   - Should show: `"allTablesExist": true`
   - Should show: `"tableCount": 7`

2. ✅ Refresh your inventory page
   - Error should be gone
   - You can now add inventory items!

3. ✅ Start using the system!

