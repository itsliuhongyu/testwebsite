import { GOOGLE_SHEETS_API_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';

const RACES_SPREADSHEET_ID = '1XecLv5Q-ZFr-5ijvhHqEiVbX6MPl61jJDmiS4GuG-SY';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const sheetName = url.searchParams.get('sheet');
    
    if (!sheetName) {
        throw error(400, 'Sheet name is required');
    }
    
    if (!GOOGLE_SHEETS_API_KEY) {
        throw error(500, 'Google Sheets API key not configured');
    }

    try {
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${RACES_SPREADSHEET_ID}/values/${sheetName}?key=${GOOGLE_SHEETS_API_KEY}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw error(response.status, `Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            return json([]);
        }
        
        // First row is headers
        const headers = data.values[0];
        
        // Convert rows to objects
        const races = data.values.slice(1).map((row, index) => {
            const race = { id: index };
            
            headers.forEach((header, i) => {
                race[header.toLowerCase().trim()] = row[i] || '';
            });
            
            return race;
        });
        
        return json(races);
        
    } catch (err) {
        console.error('Error fetching race data:', err);
        throw error(500, 'Failed to fetch race data from Google Sheets');
    }
}
