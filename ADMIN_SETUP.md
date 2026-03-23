# Admin Panel Setup Guide

## Prerequisites

- **Node.js** (v18 or newer)
- **MongoDB** (local or cloud, e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` and update:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/harsha-kaptures
ADMIN_PASSWORD=your_secure_password
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
GOOGLE_SHEET_EXPORT_KEY=your_secret_export_key
TELEGRAM_BOT_TOKEN=your_botfather_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

- **MONGODB_URI**: Your MongoDB connection string
- **ADMIN_PASSWORD**: Password for admin login at `/admin`
- **GOOGLE_SCRIPT_URL**: Web App URL (contact form + admin export use the same URL)
- **GOOGLE_SHEET_EXPORT_KEY**: Secret key for fetching submissions (see Google Apps Script setup below)
- **TELEGRAM_BOT_TOKEN**: Bot token from @BotFather
- **TELEGRAM_CHAT_ID**: Your chat ID (user or group) to receive contact alerts

## 3. Google Apps Script – Export Setup

To show and export submissions in the admin panel, add an export key to your Apps Script:

1. In Google Apps Script, go to **Project Settings** (gear icon)
2. Under **Script Properties**, add:
   - **Key**: `EXPORT_KEY`
   - **Value**: a secret string (e.g. `my_secret_export_key_123`)
3. Use the same value in `.env` as `GOOGLE_SHEET_EXPORT_KEY`
4. Save and redeploy the web app

## 4. Seed Initial Data (Optional)

To populate the database with your current projects:

```bash
npm run seed
```

## 5. Start the Server

```bash
npm start
```

- **Main site**: http://localhost:3000
- **Admin panel**: http://localhost:3000/admin

## Admin Panel Features

- **Projects**: Create, edit, delete projects; add images via URL or upload
- **Settings**: Toggle "View More" (when disabled, only 6 projects are shown)
- **Submissions**: View contact form submissions from Google Sheet; download CSV or XLSX

## Notes

- Contact submissions are sent to Google Sheets (if configured) and Telegram notifications (if configured)
- Changes in the admin panel are pushed to the user site in real time via WebSockets
- Use MongoDB Atlas for a cloud database if you don’t run MongoDB locally
