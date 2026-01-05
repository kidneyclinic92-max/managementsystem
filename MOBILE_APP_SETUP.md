# Mobile App Setup Guide

## Overview
A React Native mobile app for vendors to place orders from your warehouse inventory management system. The app integrates seamlessly with your existing backend API.

## Features

✅ **Authentication** - Login with existing user credentials
✅ **Browse Inventory** - View all available items with real-time stock
✅ **Shopping Cart** - Add items and manage quantities
✅ **Barcode Scanning** - Quick item lookup via barcode
✅ **Order Placement** - Create purchase orders that sync to your system
✅ **Order History** - View past orders and status
✅ **Offline Support** - Cart persists locally

## Quick Start

### 1. Install Dependencies

```bash
cd mobile_app
npm install
```

### 2. Configure API URL

Edit `mobile_app/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_COMPUTER_IP:3000/api'  // For physical device testing
  : 'https://your-production-domain.com/api';
```

**Find your IP address:**
- Windows: Run `ipconfig` and look for "IPv4 Address"
- Mac/Linux: Run `ifconfig` or `ip addr`

### 3. Start Development Server

```bash
npm start
```

### 4. Test on Device

1. Install **Expo Go** app on your phone
2. Scan the QR code shown in terminal
3. App will load on your device

## API Integration

The mobile app uses your existing API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User authentication |
| `/api/inventory` | GET | Fetch inventory items |
| `/api/orders` | POST | Create new order |
| `/api/orders?type=purchase` | GET | Get vendor orders |

### Authentication Flow

1. User enters username/password
2. App sends credentials to `/api/auth/login`
3. Backend returns JWT token and user data
4. Token stored in AsyncStorage
5. Token sent with all subsequent requests

### Order Creation Flow

1. Vendor browses inventory and adds items to cart
2. Vendor reviews cart and places order
3. App sends order to `/api/orders` with:
   - `type: "purchase"`
   - `supplier: vendor name`
   - `items: array of cart items`
4. Order created in your system with `pending_approval` status
5. Admin can approve/reject in web dashboard

## App Structure

```
mobile_app/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Login screen
│   ├── (tabs)/
│   │   ├── inventory.tsx    # Browse inventory
│   │   ├── cart.tsx         # Shopping cart
│   │   ├── orders.tsx       # Order history
│   │   └── profile.tsx      # User profile
│   └── scanner.tsx          # Barcode scanner
├── context/
│   ├── AuthContext.tsx      # Authentication state
│   └── CartContext.tsx      # Shopping cart state
├── services/
│   └── api.ts               # API client
└── types/
    └── index.ts             # TypeScript types
```

## Key Features Explained

### Inventory Browsing
- Real-time stock levels
- Search by name, SKU, or barcode
- Low stock indicators
- Price display
- Quick add to cart

### Shopping Cart
- Add/remove items
- Adjust quantities
- Calculate totals
- Place order with one tap

### Barcode Scanning
- Uses device camera
- Supports EAN, UPC, QR codes
- Auto-adds scanned items to cart
- Works offline (scans stored locally)

### Order Management
- View all vendor orders
- Track order status
- See approval status
- Order details

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Browse inventory items
- [ ] Search for items
- [ ] Add items to cart
- [ ] Scan barcode to add item
- [ ] Adjust cart quantities
- [ ] Place order
- [ ] View order in history
- [ ] Check order appears in web dashboard
- [ ] Logout and re-login

## Troubleshooting

### "Network request failed"
- Check API URL is correct
- Ensure backend server is running
- For physical device, verify same network
- Check firewall settings

### "Unauthorized" errors
- Verify login credentials
- Check token is being sent
- Clear app data and re-login

### Barcode scanner not working
- Grant camera permissions
- Check device camera works
- Try different barcode formats

### Orders not appearing
- Check order was created successfully
- Verify API response
- Check web dashboard for orders
- Review server logs

## Production Deployment

### Build for Android
```bash
eas build --platform android
```

### Build for iOS
```bash
eas build --platform ios
```

### Environment Variables
Set production API URL in `services/api.ts`:
```typescript
const API_BASE_URL = 'https://your-production-domain.com/api';
```

## Security Considerations

1. **Token Storage**: JWT tokens stored in AsyncStorage (encrypted on device)
2. **HTTPS**: Always use HTTPS in production
3. **API Authentication**: All requests require valid JWT token
4. **Error Handling**: Sensitive errors not exposed to users

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure API URL
3. ✅ Test on device
4. ✅ Test order placement
5. ✅ Verify orders in web dashboard
6. ⏭️ Deploy to app stores

## Support

For issues:
1. Check server logs
2. Review API responses
3. Test API endpoints directly
4. Verify network connectivity

















