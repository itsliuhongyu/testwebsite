import { GOOGLE_SHEETS_API_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';

const SPREADSHEET_ID = '1H2tgXpnn7kt8KxvPkLSELsU5ohYFM0p2tvBQJi5M44E';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const sheetName = url.searchParams.get('sheet') || 'Candidate';
    
    if (!GOOGLE_SHEETS_API_KEY) {
        throw error(500, 'Google Sheets API key not configured');
    }

    try {
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${GOOGLE_SHEETS_API_KEY}`;
        
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
        const items = data.values.slice(1).map((row, index) => {
            const item = { id: index };
            
            headers.forEach((header, i) => {
                item[header.toLowerCase().trim()] = row[i] || '';
            });
            
            return item;
        });
        
        return json(items);
        
    } catch (err) {
        console.error('Error fetching from Google Sheets API:', err);
        throw error(500, 'Failed to fetch data from Google Sheets');
    }
}
