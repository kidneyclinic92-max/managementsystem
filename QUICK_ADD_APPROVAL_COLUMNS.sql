-- Quick SQL Script to Add Approval Fields
-- Copy and paste this into Azure Portal Query Editor

-- Add approval fields to orders table
ALTER TABLE orders
ADD approval_status NVARCHAR(20),
    approved_by NVARCHAR(100),
    approved_at DATETIME2,
    rejected_by NVARCHAR(100),
    rejected_at DATETIME2,
    rejection_reason NVARCHAR(500);

-- Set default values for existing orders
UPDATE orders 
SET approval_status = CASE 
    WHEN type = 'sale' THEN 'approved'
    WHEN type = 'purchase' THEN 'pending_approval'
    ELSE 'approved'
END
WHERE approval_status IS NULL;

-- Create index for better performance
CREATE INDEX idx_orders_approval_status ON orders(approval_status);

PRINT 'Approval fields added successfully!';

