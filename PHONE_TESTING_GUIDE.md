# 📱 How to Test Your Website on Your Phone

## Quick Start

1. **Double-click `start-server.bat`** on your computer
2. Note the IP address shown (e.g., `192.168.1.100`)
3. On your phone, open a browser and go to: `http://[YOUR_IP]:8000`
   - Example: `http://192.168.1.100:8000`

## Detailed Steps

### Step 1: Start the Server

1. Double-click `start-server.bat` file
2. A black window will open showing:
   - Your computer's IP address
   - The URL to use on your phone
3. **Keep this window open** while testing

### Step 2: Connect Your Phone

**Important:** Your phone and computer must be on the **same WiFi network**

1. Make sure your phone is connected to the same WiFi as your computer
2. Open a web browser on your phone (Chrome, Safari, etc.)
3. Type the URL shown in the server window
   - Format: `http://192.168.1.XXX:8000`
   - Replace `XXX` with your actual IP address

### Step 3: Test Your Website

- Navigate through all pages
- Test the mobile menu (hamburger icon ☰)
- Try tapping images to zoom
- Fill out the contact form
- Check that everything looks good on mobile

### Step 4: Stop the Server

- Press `Ctrl+C` in the server window
- Or simply close the window

## Troubleshooting

### "Can't connect" Error

**Problem:** Phone can't reach the server

**Solutions:**
1. ✅ Make sure both devices are on the same WiFi
2. ✅ Check Windows Firewall - it might be blocking the connection
3. ✅ Try disabling VPN if you're using one
4. ✅ Make sure the server window is still open

### "Python/Node.js not found" Error

**Problem:** The BAT file can't find Python or Node.js

**Solutions:**
1. Install Python: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
2. OR Install Node.js: https://nodejs.org/
   - This will also install npm

### Finding Your IP Address Manually

If the BAT file doesn't show your IP:

1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Look for "IPv4 Address" under your WiFi adapter
5. Use that IP address with port 8000

## Alternative: Using Your Phone's Hotspot

If you can't use the same WiFi:

1. Turn on mobile hotspot on your phone
2. Connect your computer to the hotspot
3. Find your computer's IP address (it will be different)
4. Use that IP address on your phone

## Alternative: Online Testing Tools

If local testing doesn't work, use these online tools:

1. **Chrome DevTools Device Mode**
   - Open Chrome on your computer
   - Press `F12`
   - Click device icon (📱)
   - Select device from dropdown

2. **BrowserStack** (https://www.browserstack.com/)
   - Free trial available
   - Test on real devices online

3. **Responsive Design Mode**
   - Firefox: Press `Ctrl+Shift+M`
   - Chrome: Press `F12` then `Ctrl+Shift+M`

## Tips for Mobile Testing

- ✅ Test in portrait and landscape modes
- ✅ Test on different screen sizes if possible
- ✅ Check touch interactions (taps, swipes)
- ✅ Test form inputs (keyboard should appear correctly)
- ✅ Check image loading and zoom
- ✅ Verify navigation menu works smoothly

---

**Need Help?** Make sure both devices are on the same WiFi network and the server window is open!
