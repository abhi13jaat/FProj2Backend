import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

let auth;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
     auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines in ENV
      ['https://www.googleapis.com/auth/spreadsheets']
    );
  }
} catch (error) {
  console.error('Google Sheets Auth Error:', error);
}

export const appendToSheet = async (data) => {
  if (!auth || !process.env.GOOGLE_SHEET_ID) {
    console.warn('Google Sheets not configured. Skipping append.');
    return;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:G', // Updated columns: Date, Name, Email, Course, Tier, Domains, Status
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [data],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
};
