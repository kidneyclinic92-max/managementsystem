# WareHouse.io - Vendor Mobile App

A minimal mobile app for vendors to place orders from the warehouse inventory system.

## Features

✅ **Login** - Secure authentication with JWT  
✅ **Browse Inventory** - View available products with real-time stock  
✅ **Shopping Cart** - Add items and manage quantities  
✅ **Place Orders** - Submit purchase orders to warehouse  
✅ **Order History** - Track your order status  

## Quick Start

### 1. Install Dependencies

```bash
cd working_mobile_app
npm install
```

### 2. Configure Backend URL

Open `services/api.ts` and update the IP address:

```typescript
const DEFAULT_LOCAL_IP = '192.168.1.100'; // <-- Change to your computer's IP
```

**How to find your IP:**
- **Windows:** Run `ipconfig` in CMD (look for IPv4 Address)
- **Mac/Linux:** Run `ifconfig` or `hostname -I` in Terminal

### 3. Start the App

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

### 4. Login

Use these test credentials:
- Username: `staff`
- Password: `staff123`

## Project Structure

```
working_mobile_app/
├── app/
│   ├── _layout.tsx           # Root layout with providers
│   ├── index.tsx             # Login screen
│   └── (tabs)/               # Main app screens
│       ├── inventory.tsx     # Browse products
│       ├── cart.tsx          # Shopping cart
│       ├── orders.tsx        # Order history
│       └── profile.tsx       # User profile
├── context/
│   ├── AuthContext.tsx       # Authentication state
│   └── CartContext.tsx       # Shopping cart state
├── services/
│   └── api.ts                # API client
└── types/
    └── index.ts              # TypeScript types
```

## How It Works

1. **Login** → Enter username/password → Get JWT token
2. **Browse** → View all inventory items from warehouse
3. **Add to Cart** → Select items and quantities
4. **Place Order** → Enter supplier name → Submit order
5. **Order** → Goes to warehouse admin for approval

## Requirements

- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator / Physical device with Expo Go

## Backend Connection

The app connects to your Next.js backend API:
- `POST /api/auth/login` - Authentication
- `GET /api/inventory` - Get products
- `POST /api/orders` - Create order
- `GET /api/orders` - Get order history

## Troubleshooting

### "Network Error" when logging in

1. Make sure your backend server is running (`npm run dev` in main project)
2. Update IP address in `services/api.ts`
3. Ensure phone and computer are on same WiFi network
4. Check firewall isn't blocking port 3000

### "Unable to resolve module"

```bash
npm install
npx expo start -c  # Clear cache
```

### Can't scan barcode on iOS

Barcode scanning is not included in this minimal version. It can be added with `expo-camera` if needed.

## Next Steps

Once the basic app is working:
- Test placing an order
- Check that order appears in web dashboard
- Verify admin can approve the order
- Test order status updates

## Support

For issues or questions, check the main project README or contact your development team.












