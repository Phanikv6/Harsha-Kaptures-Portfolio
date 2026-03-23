# Google Sheets Integration Setup Guide

This guide will help you connect your contact form to Google Sheets so that all form submissions are automatically saved.

## Step 1: Create or Open Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet or open an existing one
3. In the first row (Row 1), add these column headers:
   - **A1**: Timestamp
   - **B1**: First Name
   - **C1**: Last Name
   - **D1**: Email
   - **E1**: Phone
   - **F1**: Message
4. Make the header row bold (select row 1 and click the **B** button)
5. **Note the name of your sheet** (usually "Sheet1" by default, shown at the bottom)

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. A new tab will open with the Apps Script editor
3. Delete all the default code in the editor
4. Open the file `google-apps-script.js` from this project folder
5. Copy **all the code** from that file
6. Paste it into the Apps Script editor

## Step 3: Configure the Script

1. In the script, find this line:
   ```javascript
   const sheetName = 'Sheet1';
   ```
2. Replace `'Sheet1'` with your actual sheet name if it's different
3. Click the **Save** icon (💾) or press `Ctrl+S` (Windows) / `Cmd+S` (Mac)
4. Give your project a name when prompted (e.g., "Contact Form Handler")

## Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the **gear icon (⚙️)** next to "Select type"
3. Choose **Web app** from the dropdown
4. Fill in the deployment settings:
   - **Description**: Contact Form Handler (or any name you prefer)
   - **Execute as**: Me (your email)
   - **Who has access**: **Anyone** (important!)
5. Click **Deploy**
6. You may be asked to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. **Copy the Web App URL** that appears (it will look like: `https://script.google.com/macros/s/...`)

## Step 5: Update Your Website

1. Open `script.js` in your project
2. Find this line:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL'` with the Web App URL you copied
4. It should look like:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
   ```
5. Save the file

## Step 6: Test It!

1. Open your website in a browser
2. Fill out the contact form
3. Click **Send**
4. Check your Google Sheet - you should see the new row with the form data!

## Troubleshooting

### Form submissions not appearing in Google Sheets?

1. **Check the sheet name**: Make sure the sheet name in the script matches your actual sheet name
2. **Check permissions**: Ensure the Web App is deployed with "Anyone" access
3. **Check browser console**: Open Developer Tools (F12) and check for any errors
4. **Verify the URL**: Make sure the Web App URL in `script.js` is correct and complete

### Getting CORS errors?

- The script uses `mode: 'no-cors'` which should prevent CORS issues
- If you still see errors, make sure the Web App URL is correct

### Need to update the script?

- After making changes to the Apps Script, you need to create a **new deployment**
- Go to **Deploy** → **Manage deployments**
- Click the **pencil icon** to edit
- Click **New version**
- Click **Deploy**
- The URL will remain the same, so no need to update your website

## Security Note

The Web App URL is public, but it's tied to your Google account. Only authorized users (you) can modify the script. The form submissions will only be saved to your Google Sheet.

---

**That's it!** Your contact form is now connected to Google Sheets. Every form submission will automatically be saved with a timestamp.

