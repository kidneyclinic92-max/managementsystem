# ZiiZii Integration Setup Guide

## Overview
This guide explains how to integrate your inventory management system with ZiiZii Grocery Supply Company (https://gsc.ziizii.io/zz/) to automatically sync vendor orders.

## Integration Methods

### Method 1: Webhook Integration (Recommended)
ZiiZii sends order data to your system in real-time when vendors place orders.

**Steps:**
1. Contact ZiiZii support to enable webhook integration
2. Provide them with your webhook URL:
   ```
   https://your-domain.com/api/integrations/ziizii/webhook
   ```
3. Configure API key authentication (see below)

### Method 2: API Polling
Your system periodically fetches new orders from ZiiZii API.

**Steps:**
1. Obtain ZiiZii API credentials
2. Configure API endpoint and credentials
3. Set up automatic polling (every 15-30 minutes)

## Configuration

### Step 1: Add Environment Variables

Add these to your `.env.local` file:

```env
# ZiiZii Integration
ZIIZII_API_URL=https://gsc.ziizii.io/api
ZIIZII_API_KEY=your_api_key_here
ZIIZII_USERNAME=your_username
ZIIZII_PASSWORD=your_password
```

### Step 2: Get ZiiZii API Credentials

1. **Contact ZiiZii Support:**
   - Email or call their support team
   - Request API access for integration
   - Ask for:
     - API endpoint URL
     - API key or authentication method
     - Webhook setup (if available)
     - Order data format/schema

2. **Check ZiiZii Documentation:**
   - Look for API documentation on their website
   - Check for developer portal or API section

### Step 3: Configure Webhook in ZiiZii

If ZiiZii supports webhooks:
1. Log into ZiiZii admin panel
2. Navigate to Settings → Integrations
3. Add webhook URL: `https://your-domain.com/api/integrations/ziizii/webhook`
4. Set webhook events: "Order Created", "Order Updated"
5. Configure authentication (API key)

### Step 4: Test Integration

1. Go to **Integrations** page in your system
2. Click **"Sync Orders Now"** to test
3. Check if orders appear in your Orders page
4. Verify order data is correct

## How It Works

### Order Flow

1. **Vendor places order on ZiiZii** →
2. **ZiiZii sends webhook** (or you poll API) →
3. **Our system receives order** →
4. **Order created as "Purchase Order"** →
5. **Status: "pending_approval"** →
6. **Admin approves order** →
7. **Inventory updated**

### Order Mapping

| ZiiZii Field | Our System Field |
|--------------|------------------|
| `order_number` | `orderNumber` |
| `vendor` | `supplier` |
| `items[].sku` | `items[].itemId` (matched by SKU) |
| `items[].quantity` | `items[].quantity` |
| `items[].price` | `items[].price` |
| `total` | `total` |

## API Endpoints

### Webhook Endpoint
```
POST /api/integrations/ziizii/webhook
Headers:
  x-api-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "order_number": "ZII-12345",
  "vendor": "Vendor Name",
  "items": [
    {
      "sku": "SKU-001",
      "name": "Product Name",
      "quantity": 10,
      "price": 9.99
    }
  ]
}
```

### Manual Sync Endpoint
```
POST /api/integrations/ziizii/sync
Auth: Admin only
```

## Troubleshooting

### "Unauthorized" Error
- Check `ZIIZII_API_KEY` in `.env.local`
- Verify API key matches ZiiZii configuration

### "Order already exists"
- System prevents duplicate orders
- Check order number in ZiiZii matches your system

### Orders not appearing
- Check webhook is configured in ZiiZii
- Verify webhook URL is accessible
- Check server logs for errors
- Try manual sync from Integrations page

### Items not matching
- Ensure SKUs in ZiiZii match SKUs in your inventory
- Check barcode mapping
- Verify item names match

## Next Steps

1. **Contact ZiiZii Support:**
   - Request API documentation
   - Get API credentials
   - Ask about webhook support

2. **Test with Sample Data:**
   - Use webhook test endpoint
   - Send sample order JSON
   - Verify it creates order correctly

3. **Adjust Data Mapping:**
   - Update webhook route based on actual ZiiZii format
   - Map all required fields
   - Handle edge cases

4. **Monitor Integration:**
   - Check Integrations page regularly
   - Monitor order sync status
   - Set up error alerts

## Support

If you need help:
1. Check server logs for detailed errors
2. Test webhook endpoint: `GET /api/integrations/ziizii/webhook`
3. Verify environment variables are set
4. Contact ZiiZii support for API issues


















