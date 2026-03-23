require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/harsha-kaptures',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  googleScriptUrl: process.env.GOOGLE_SCRIPT_URL || '',
  googleSheetExportKey: process.env.GOOGLE_SHEET_EXPORT_KEY || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
};
