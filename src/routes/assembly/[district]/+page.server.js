import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    return {
        mapboxToken: MAPBOX_ACCESS_TOKEN || ''
    };
}
