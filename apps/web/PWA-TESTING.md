# 🧪 Testing PWA - Step by Step Guide

## 🚀 Quick Start

### Option 1: Using NPM script (Recommended)
```bash
npm run serve:pwa
```

### Option 2: Using Shell script
```bash
./test-pwa.sh
```

### Option 3: Manual
```bash
npm run build:prod
cd dist/save-to-dream/browser
npx http-server -p 8080 -c-1
```

Then open: http://localhost:8080

## 🔍 How to Check Service Worker Status

### Method 1: Chrome DevTools (Visual)

1. **Open DevTools:**
   - Windows/Linux: `F12` or `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`

2. **Go to Application tab**

3. **Click "Service Workers" in left menu**

4. **You should see:**
   ```
   ✅ Source: http://localhost:8080/ngsw-worker.js
   ✅ Status: activated and is running
   ✅ Scope: http://localhost:8080/
   ```

### Method 2: Console Commands

Open DevTools Console and run:

```javascript
// Check if Service Worker is registered
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('📊 Registrations:', regs.length);
  regs.forEach((reg, i) => {
    console.log(`\n📦 Registration ${i + 1}:`);
    console.log('  Scope:', reg.scope);
    console.log('  State:', reg.active?.state);
    console.log('  Script URL:', reg.active?.scriptURL);
  });
});

// Check Service Worker controller
console.log('🎮 Controller:', navigator.serviceWorker.controller);

// Check if page is controlled by SW
if (navigator.serviceWorker.controller) {
  console.log('✅ This page is controlled by Service Worker');
} else {
  console.log('⚠️ This page is NOT controlled by Service Worker');
  console.log('💡 Refresh the page (Ctrl+R or Cmd+R)');
}
```

## ✅ Testing PWA Features

### 1️⃣ Test Offline Mode

1. Open http://localhost:8080
2. Open DevTools → Network tab
3. Check "Offline" checkbox
4. Refresh page (F5)
5. ✅ **App should still work!**

### 2️⃣ Test Installation

#### Desktop (Chrome/Edge):
- Look for ➕ install icon in address bar
- Click → Install
- ✅ App opens in standalone window

#### Mobile (Chrome):
- Menu (⋮) → "Add to Home screen"
- ✅ Icon appears on home screen

#### iOS Safari:
- Share button → "Add to Home Screen"
- ✅ Icon appears on home screen

### 3️⃣ Test Cache

1. Open http://localhost:8080
2. Open DevTools → Application → Cache Storage
3. Expand "ngsw:..." entries
4. ✅ Should see cached files:
   - index.html
   - main.js
   - styles.css
   - icons

### 4️⃣ Test Manifest

1. Open DevTools → Application → Manifest
2. ✅ Check:
   - Name: "Save to Dream"
   - Short name: "SaveToDream"
   - Theme color: #d98e73
   - Icons: 8 different sizes
   - Display: standalone

### 5️⃣ Run Lighthouse Audit

1. Open DevTools → Lighthouse tab
2. Select:
   - ✅ Progressive Web App
   - ✅ Performance
3. Click "Analyze page load"
4. ✅ PWA score should be 90+/100

## 🐛 Troubleshooting

### ❌ Service Worker not appearing?

**Solution 1:** Hard refresh
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Solution 2:** Clear cache
```
DevTools → Application → Storage → Clear site data
```

**Solution 3:** Check console for errors
```
DevTools → Console
Look for red errors
```

### ❌ "Offline" not working?

1. Make sure Service Worker is **activated** (not just installed)
2. Refresh page once after first load
3. Service Worker needs one reload to take control

### ❌ Can't install app?

**Requirements:**
- ✅ HTTPS (or localhost)
- ✅ Valid manifest.json
- ✅ At least one icon (192x192 or larger)
- ✅ Service Worker registered
- ✅ start_url responds with 200

## 📱 Test on Real Device

### 1. Find your local IP:
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### 2. Update server to allow external connections:
```bash
npx http-server -p 8080 -c-1 --cors
```

### 3. Open on mobile:
```
http://YOUR_IP:8080
```

⚠️ **Note:** Service Worker requires HTTPS on real devices (localhost is exempt)

For HTTPS testing, use:
```bash
npx http-server -p 8080 -S -C cert.pem -K key.pem
```

## 🎯 Expected Results

✅ **Service Worker:** Registered and activated
✅ **Offline:** App loads without internet
✅ **Install:** Can be installed on device
✅ **Cache:** All assets cached
✅ **Manifest:** Valid with all metadata
✅ **Lighthouse PWA:** Score 90+

## 🚀 Production Deployment

When deploying to production:

1. ✅ Ensure HTTPS is enabled
2. ✅ Check all icons load correctly
3. ✅ Test on multiple browsers
4. ✅ Test on mobile devices
5. ✅ Run Lighthouse audit on live site

## 📚 Useful Links

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://web.dev/add-manifest/)
