/** @type {import('./$types').PageLoad} */
export async function load() {
	return {
		stories: [],
		mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
	};
}
