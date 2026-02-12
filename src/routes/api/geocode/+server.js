import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';
import { json, error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const query = url.searchParams.get('query');
    
    if (!query) {
        throw error(400, 'Query parameter is required');
    }

    if (!MAPBOX_ACCESS_TOKEN) {
        throw error(500, 'Mapbox access token not configured');
    }

    try {
        const encodedQuery = encodeURIComponent(query);
        // Restrict to Wisconsin and only address types
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US&limit=5&types=address&bbox=-92.889,42.491,-86.249,47.309`;
        
        const response = await fetch(mapboxUrl);
        
        if (!response.ok) {
            throw error(response.status, 'Mapbox API request failed');
        }
        
        const data = await response.json();
        return json(data);
    } catch (err) {
        console.error('Geocoding error:', err);
        throw error(500, 'Failed to geocode address');
    }
}
