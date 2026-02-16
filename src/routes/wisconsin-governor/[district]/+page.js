/** @type {import('./$types').PageLoad} */
export async function load() {
    return {
        mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
    };
}
