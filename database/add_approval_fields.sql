-- Add approval fields to orders table
-- Run this script to add purchase order approval functionality

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'approval_status')
BEGIN
    ALTER TABLE orders
    ADD approval_status NVARCHAR(20) DEFAULT 'pending_approval',
        approved_by NVARCHAR(100),
        approved_at DATETIME2,
        rejected_by NVARCHAR(100),
        rejected_at DATETIME2,
        rejection_reason NVARCHAR(500);
    
    -- Update existing orders: sales orders don't need approval, purchases need approval
    UPDATE orders 
    SET approval_status = CASE 
        WHEN type = 'sale' THEN 'approved'
        WHEN type = 'purchase' THEN 'pending_approval'
        ELSE 'approved'
    END
    WHERE approval_status IS NULL;
    
    CREATE INDEX idx_orders_approval_status ON orders(approval_status);
    
    PRINT 'Approval fields added successfully';
END
ELSE
BEGIN
    PRINT 'Approval fields already exist';
END;

