# Purchase Order Approval Workflow

## Overview

Purchase orders now require approval before they can be processed. This ensures proper authorization and control over purchasing decisions.

## Who Can Approve?

**Only Administrators** can approve or reject purchase orders.

- **Admin Role**: Can approve/reject purchase orders
- **Staff Role**: Can create purchase orders but cannot approve them

## Approval Workflow

### 1. Order Creation
- When a **purchase order** is created, it automatically gets:
  - Status: `pending`
  - Approval Status: `pending_approval`
- **Sales orders** are automatically approved (no approval needed)

### 2. Approval Process

#### For Admins:
1. Go to **Orders** page
2. Find purchase orders with **"Pending Approval"** badge
3. Click the **✓ (green checkmark)** to approve
4. Or click the **✗ (red X)** to reject
   - If rejecting, you'll be prompted to enter a reason

#### After Approval:
- **Approved**: 
  - Status changes to `processing`
  - Order can proceed with inventory updates
  - Shows "✓ Approved by [admin name]"

#### After Rejection:
- **Rejected**:
  - Status changes to `cancelled`
  - Order is blocked from processing
  - Shows rejection reason
  - Inventory is NOT updated

### 3. Approval Statuses

| Status | Description | Who Can See |
|--------|-------------|-------------|
| `pending_approval` | Waiting for admin approval | Everyone |
| `approved` | Approved by admin, can proceed | Everyone |
| `rejected` | Rejected by admin, cancelled | Everyone |

## Database Setup

To enable approval functionality, run this SQL script in your Azure SQL Database:

```sql
-- File: database/add_approval_fields.sql
```

This adds the following fields to the `orders` table:
- `approval_status` - Current approval status
- `approved_by` - Username who approved
- `approved_at` - Timestamp of approval
- `rejected_by` - Username who rejected
- `rejected_at` - Timestamp of rejection
- `rejection_reason` - Reason for rejection

## API Endpoints

### Approve Order
```
POST /api/orders/[id]/approve
```
- **Auth**: Admin only
- **Action**: Approves purchase order, sets status to `processing`

### Reject Order
```
POST /api/orders/[id]/reject
Body: { "reason": "Rejection reason" }
```
- **Auth**: Admin only
- **Action**: Rejects purchase order, sets status to `cancelled`

## UI Features

### Orders Table
- New **"Approval"** column showing approval status
- **Approve/Reject buttons** (admin only) for pending orders
- **Visual badges**:
  - 🟡 Yellow: Pending Approval
  - 🟢 Green: Approved
  - 🔴 Red: Rejected

### Order Details
- Shows who approved/rejected
- Shows approval/rejection timestamp
- Shows rejection reason (if rejected)

## Business Rules

1. **Purchase Orders**: Require approval before processing
2. **Sales Orders**: Auto-approved (no approval needed)
3. **Approved Orders**: Can proceed with inventory updates
4. **Rejected Orders**: Cancelled, no inventory changes
5. **Only Admins**: Can approve/reject purchase orders

## Example Workflow

1. **Staff creates purchase order**:
   - Order created with `pending_approval` status
   - Inventory NOT updated yet

2. **Admin reviews order**:
   - Sees "Pending Approval" badge
   - Reviews order details

3. **Admin approves**:
   - Clicks approve button
   - Order status → `processing`
   - Approval status → `approved`
   - Inventory quantities updated (for purchase orders, inventory increases)

4. **Order proceeds**:
   - Order can now be processed normally
   - Can be picked, packed, shipped, etc.

## Troubleshooting

### "Order not found" error
- Check if order ID is correct
- Verify order exists in database

### "Only admins can approve" error
- Make sure you're logged in as admin
- Check your user role in settings

### Approval buttons not showing
- Verify you're logged in as admin
- Check if order is a purchase order (sales orders don't need approval)
- Refresh the page

## Future Enhancements

Potential improvements:
- Multi-level approval (e.g., manager → director)
- Approval limits based on order amount
- Email notifications for pending approvals
- Approval history/audit trail
- Bulk approval functionality

