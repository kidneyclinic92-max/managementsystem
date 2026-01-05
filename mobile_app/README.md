# WareHouse Vendor Mobile App

Mobile application for vendors to place orders from the warehouse inventory management system.

## Features

- 🔐 **Authentication** - Secure login with JWT
- 📦 **Browse Inventory** - View all available items with real-time stock
- 🛒 **Shopping Cart** - Add items to cart and manage quantities
- 📱 **Barcode Scanning** - Scan barcodes to quickly add items
- 📋 **Order History** - View past orders and their status
- 👤 **User Profile** - Manage account settings

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **Barcode Scanning**: Expo Camera

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

## Installation

1. Navigate to mobile app directory:
```bash
cd mobile_app
```

2. Install dependencies:
```bash
npm install
```

3. Configure API URL:
   - Update `services/api.ts` with your backend URL
   - For development: `http://localhost:3000/api` (use your computer's IP for physical device)
   - For production: `https://your-domain.com/api`

4. Start the development server:
```bash
npm start
```

5. Scan QR code with Expo Go app (iOS) or Expo Go (Android)

## API Integration

The app connects to your inventory management system's API:

- `POST /api/auth/login` - User authentication
- `GET /api/inventory` - Fetch inventory items
- `POST /api/orders` - Create new order
- `GET /api/orders?type=purchase` - Get vendor orders

## Environment Setup

For physical device testing, update the API URL in `services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_COMPUTER_IP:3000/api'  // e.g., 'http://192.168.1.100:3000/api'
  : 'https://your-production-domain.com/api';
```

Find your IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

## Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## Features in Detail

### Inventory Browsing
- Search by name, SKU, or barcode
- View stock levels and prices
- Low stock indicators
- Real-time inventory sync

### Shopping Cart
- Add/remove items
- Adjust quantities
- View total
- Place orders directly

### Barcode Scanning
- Scan product barcodes
- Automatically add to cart
- Supports EAN, UPC, QR codes

### Order Management
- View order history
- Track order status
- See approval status
- Order details

## Troubleshooting

### Connection Issues
- Ensure backend server is running
- Check API URL is correct
- Verify network connectivity
- For physical device, ensure phone and computer are on same network

### Authentication Issues
- Check if JWT token is being sent correctly
- Verify backend auth endpoint is working
- Clear app data and re-login

### Barcode Scanning Not Working
- Grant camera permissions
- Ensure good lighting
- Try different barcode formats

## Next Steps

1. Update API URL in `services/api.ts`
2. Test authentication flow
3. Test inventory browsing
4. Test order placement
5. Configure for production deployment

















