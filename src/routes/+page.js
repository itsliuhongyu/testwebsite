// Cache stories in memory for the session
/** @type {Array<{id: string, title: string, url: string, creator: string, pubDate: string, image: string, imageAlt: string, imageSrcset: string, imageSizes: string, imageWidth: string, imageHeight: string}> | null} */
let cachedStories = null;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	// Return cached stories if available
	if (cachedStories !== null) {
		return {
			stories: cachedStories,
			mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
		};
	}
	
	// Fetch stories from our API endpoint (which fetches from Wisconsin Watch RSS feed server-side)
	let stories = [];
	
	try {
		const response = await fetch('/api/stories');
		stories = await response.json();
		// Cache the stories for this session
		cachedStories = stories;
	} catch (error) {
		console.error('Error fetching stories:', error);
		// Return empty array on error so the page still loads
		stories = [];
	}
	
	return {
		stories,
		mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
	};
}
