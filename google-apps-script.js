/**
 * Google Apps Script for Contact Form Submission
 * Sheet name: tesxt (change SHEET_NAME if your tab has a different name)
 *
 * EXPORT: Add EXPORT_KEY to script properties (Project Settings > Script Properties)
 * Key: EXPORT_KEY, Value: your_secret_key
 * Then set GOOGLE_SCRIPT_URL and GOOGLE_SHEET_EXPORT_KEY in .env
 */

const SHEET_NAME = 'tesxt';

function doGet(e) {
  const params = e?.parameter || {};
  if (params.action === 'export' && params.key) {
    const key = PropertiesService.getScriptProperties().getProperty('EXPORT_KEY');
    if (key && params.key === key) {
      try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
        if (!sheet || sheet.getLastRow() < 1) {
          return ContentService.createTextOutput(JSON.stringify({ submissions: [] })).setMimeType(ContentService.MimeType.JSON);
        }
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const submissions = data.slice(1).map(function (row) {
          const obj = {};
          headers.forEach(function (h, i) { obj[h] = row[i] || ''; });
          return obj;
        });
        return ContentService.createTextOutput(JSON.stringify({ submissions: submissions })).setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ submissions: [], error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Contact form endpoint' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      newSheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Message']]);
      newSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Sheet created' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.message || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
