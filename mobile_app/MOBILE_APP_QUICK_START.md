# Mobile App Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd mobile_app
npm install
```

### Step 2: Configure API URL
Edit `mobile_app/services/api.ts` and set your backend URL:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_IP:3000/api'  // Replace YOUR_IP with your computer's IP
  : 'https://your-domain.com/api';
```

**Find your IP:**
- Windows: `ipconfig` → Look for "IPv4 Address"
- Mac/Linux: `ifconfig` → Look for "inet"

### Step 3: Start Backend Server
In the main project directory:
```bash
npm run dev
```

### Step 4: Start Mobile App
In `mobile_app` directory:
```bash
npm start
```

### Step 5: Test on Your Phone
1. Install **Expo Go** from App Store/Play Store
2. Scan the QR code shown in terminal
3. App loads on your device!

## 📱 Testing the App

### Login
- Use existing credentials from your system
- Default: `admin` / `admin123` or `staff` / `staff123`

### Browse Inventory
- View all available items
- Search by name, SKU, or barcode
- See stock levels and prices

### Add to Cart
- Tap "Add" button on any item
- Or scan barcode to add quickly
- View cart in "Cart" tab

### Place Order
1. Go to Cart tab
2. Review items and quantities
3. Tap "Place Order"
4. Order appears in your web dashboard!

## ✅ Verify Integration

1. **Place order in mobile app**
2. **Check web dashboard** → Orders page
3. **Order should appear** with status "pending_approval"
4. **Admin can approve** in web dashboard

## 🔧 Troubleshooting

### "Network request failed"
- ✅ Check backend is running (`npm run dev`)
- ✅ Verify API URL is correct
- ✅ Ensure phone and computer on same WiFi
- ✅ Check firewall isn't blocking port 3000

### "Unauthorized" error
- ✅ Check login credentials
- ✅ Verify token is being sent
- ✅ Clear app data and re-login

### Can't scan QR code
- ✅ Ensure Expo Go app is installed
- ✅ Phone and computer on same network
- ✅ Try typing URL manually in Expo Go

## 📝 Next Steps

1. Test all features
2. Customize app appearance
3. Add more features as needed
4. Deploy to app stores when ready

## 🎉 You're Ready!

The mobile app is now connected to your inventory management system. Vendors can place orders directly from their phones, and orders will automatically appear in your web dashboard for approval.

















