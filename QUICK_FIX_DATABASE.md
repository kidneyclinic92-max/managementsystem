# 🚀 Quick Fix: Create Database Tables

## Step 1: Verify Your Connection String

Make sure your `.env.local` file in the root directory has:

```env
AZURE_SQL_CONNECTION_STRING=Server=tcp:managementserver.database.windows.net,1433;Initial Catalog=inventorymanagement;Persist Security Info=False;User ID=admin101;Password=YOUR_PASSWORD_HERE;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**Replace `YOUR_PASSWORD_HERE` with your actual Azure SQL password.**

---

## Step 2: Create Tables in Azure Portal (Easiest Method)

### Option A: Azure Portal Query Editor ⭐ RECOMMENDED

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in

2. **Find Your Database**
   - Search for "SQL databases" in the top search bar
   - Click on: **`inventorymanagement`**

3. **Open Query Editor**
   - In the left sidebar, click **"Query editor"**
   - Click **"Use SQL authentication"**
   - Enter:
     - Username: `admin101`
     - Password: (your Azure SQL password)
   - Click **"OK"**

4. **Run the Schema Script**
   - Open `database/schema.sql` from your project folder
   - **Copy ALL the contents** (Ctrl+A, Ctrl+C)
   - **Paste into Query Editor** (Ctrl+V)
   - Click **"Run"** button (or press F5)
   - Wait for ✅ "Query succeeded" message

5. **Verify Tables Created**
   - Run this query in Query Editor:
     ```sql
     SELECT TABLE_NAME 
     FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME;
     ```
   - You should see 7 tables:
     - `audit_logs`
     - `categories`
     - `cycle_counts`
     - `inventory_items`
     - `order_items`
     - `orders`
     - `replenishment_requests`

6. **Refresh Your App**
   - Go back to your browser
   - Refresh the page (F5)
   - ✅ Error should be gone!

---

### Option B: SQL Server Management Studio (SSMS)

1. **Download SSMS** (if needed)
   - https://aka.ms/ssmsfullsetup

2. **Connect**
   - Server: `managementserver.database.windows.net`
   - Authentication: SQL Server Authentication
   - Login: `admin101`
   - Password: (your password)
   - Database: `inventorymanagement`

3. **Run Schema**
   - Open `database/schema.sql`
   - Execute (F5)

---

### Option C: Azure Data Studio

1. **Download** (if needed)
   - https://aka.ms/azuredatastudio

2. **Connect**
   - Server: `managementserver.database.windows.net`
   - Authentication: SQL Login
   - Username: `admin101`
   - Password: (your password)
   - Database: `inventorymanagement`

3. **Run Schema**
   - Open `database/schema.sql`
   - Run (F5)

---

## Troubleshooting

### ❌ "Login failed" Error
- Double-check username: `admin101`
- Verify password is correct
- Make sure you're using **SQL authentication** (not Azure AD)

### ❌ "Firewall" Error
- Go to Azure Portal → SQL Server → **Networking**
- Click **"Add your client IPv4 address"**
- Click **"Save"**
- Wait 1-2 minutes, then try again

### ❌ "Permission denied" Error
- Make sure you're connected to database: `inventorymanagement`
- Verify your user has CREATE TABLE permissions

### ❌ Still seeing error after creating tables?
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart your dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
3. **Refresh the page** (F5)

---

## What Gets Created?

The schema creates these tables:

| Table | Purpose |
|-------|---------|
| `categories` | Product categories |
| `inventory_items` | All inventory items |
| `orders` | Purchase and sales orders |
| `order_items` | Items in each order |
| `cycle_counts` | Physical inventory counts |
| `audit_logs` | Change tracking |
| `replenishment_requests` | Stock replenishment |

Plus indexes for fast queries! 🚀

---

## Need Help?

If you're still having issues:
1. Check the browser console (F12) for detailed error messages
2. Verify your connection string in `.env.local`
3. Test connection at: `http://localhost:3000/api/test-connection`

