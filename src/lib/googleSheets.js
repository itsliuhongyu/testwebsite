/**
 * Google Sheets API Utility
 * 
 * This module provides functions to fetch data from Google Sheets using server-side API endpoints.
 * The API key is kept secure on the server.
 */

const SPREADSHEET_ID = '1H2tgXpnn7kt8KxvPkLSELsU5ohYFM0p2tvBQJi5M44E';
const RACES_SPREADSHEET_ID = '1XecLv5Q-ZFr-5ijvhHqEiVbX6MPl61jJDmiS4GuG-SY';

/**
 * Fetch candidate data from Google Sheets using our server-side API
 * All candidates are now in a single "Candidate" tab
 * @param {string} sheetName - Deprecated parameter, kept for backward compatibility. Always uses "Candidate" tab.
 * @returns {Promise<Array>} Array of candidate objects
 */
export async function fetchCandidatesFromAPI(sheetName = 'Candidate') {
    try {
        // Use our server-side API endpoint
        const url = `/api/sheets/candidates?sheet=Candidate`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const candidates = await response.json();
        return candidates;
        
    } catch (error) {
        console.error('Error fetching from Google Sheets API:', error);
        // Fall back to CSV method on error
        return fetchCandidatesFromCSV();
    }
}

/**
 * Fallback method: Fetch candidate data from published CSV
 * @returns {Promise<Array>} Array of candidate objects
 */
async function fetchCandidatesFromCSV() {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQpPPS8TGtIZA3FpBVknBwwhNBdf8Mkdh3ctvLtojlKIZcgKpqCvSG5znzjsj8XLlRWdikmaKfdf-aJ/pub?gid=0&single=true&output=csv';
    
    try {
        const response = await fetch(CSV_URL);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
        }
        
        const csvContent = await response.text();
        
        // Parse CSV
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const candidates = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const candidate = { id: index };
            
            headers.forEach((header, i) => {
                candidate[header] = values[i] || '';
            });
            
            return candidate;
        });
        
        return candidates;
        
    } catch (error) {
        console.error('Error fetching CSV:', error);
        throw error;
    }
}

/**
 * Get a single candidate by ID
 * @param {number} id - Candidate ID (row index)
 * @param {string} sheetName - Deprecated parameter, kept for backward compatibility. Always uses "Candidate" tab.
 * @returns {Promise<Object|null>} Candidate object or null if not found
 */
export async function getCandidateById(id, sheetName = 'Candidate') {
    const candidates = await fetchCandidatesFromAPI();
    return candidates.find(c => c.id === parseInt(id)) || null;
}

/**
 * Get a single candidate by candidate_id
 * @param {string} candidateId - Candidate ID string (e.g., 'candidate-1')
 * @param {string} sheetName - Deprecated parameter, kept for backward compatibility. Always uses "Candidate" tab.
 * @returns {Promise<Object|null>} Candidate object or null if not found
 */
export async function getCandidateByCandidateId(candidateId, sheetName) {
    const candidates = await fetchCandidatesFromAPI();
    return candidates.find(c => c.candidate_id === candidateId) || null;
}

/**
 * Fetch race data from the races spreadsheet
 * @param {string} sheetName - The name of the sheet to fetch from (e.g., 'Assembly', 'Senate', 'Congress')
 * @returns {Promise<Array>} Array of race objects
 */
export async function fetchRacesFromAPI(sheetName) {
    try {
        // Use our server-side API endpoint
        const url = `/api/sheets/races?sheet=${encodeURIComponent(sheetName)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const races = await response.json();
        return races;
        
    } catch (error) {
        console.error('Error fetching race data:', error);
        throw error;
    }
}

/**
 * Get a single race by district number
 * @param {string|number} districtNumber - District number
 * @param {string} sheetName - The name of the sheet to fetch from (e.g., 'Assembly', 'Senate', 'US Congress')
 * @returns {Promise<Object|null>} Race object or null if not found
 */
export async function getRaceByDistrict(districtNumber, sheetName) {
    const races = await fetchRacesFromAPI(sheetName);
    return races.find(r => r['district-number'] === String(districtNumber)) || null;
}

/**
 * Get a single race by race ID
 * @param {string} raceId - Race ID (e.g., 'as-1', 'se-1', 'co-1')
 * @param {string} sheetName - The name of the sheet to fetch from (e.g., 'Assembly', 'Senate', 'US Congress')
 * @returns {Promise<Object|null>} Race object or null if not found
 */
export async function getRaceByRaceId(raceId, sheetName) {
    const races = await fetchRacesFromAPI(sheetName);
    return races.find(r => r['race-id'] === raceId) || null;
}

