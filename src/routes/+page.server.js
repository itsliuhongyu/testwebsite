import * as cheerio from 'cheerio';
import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		// Fetch the Wisconsin Watch election tag page
		const response = await fetch('https://wisconsinwatch.org/tag/wisconsin-legislature/');
		
		if (!response.ok) {
			console.error('Failed to fetch Wisconsin Watch stories:', response.status);
			return { stories: [], mapboxToken: MAPBOX_ACCESS_TOKEN || '' };
		}

		const html = await response.text();
		const $ = cheerio.load(html);
		
		const stories = [];
		
		// Parse the articles from the page
		// Adjust selectors based on the actual HTML structure of the Wisconsin Watch site
		$('article').each((index, element) => {
			if (index >= 5) return false; // Only get first 5 stories
			
			const $article = $(element);
			const $link = $article.find('h3.entry-title a, h2.entry-title a');
			const title = $link.text().trim();
			const url = $link.attr('href');
			const postId = $article.attr('data-post-id');
			const classes = $article.attr('class');
			
			if (title && url) {
				stories.push({
					id: postId || `story-${index}`,
					title,
					url,
					classes
				});
			}
		});

		return {
			stories,
			mapboxToken: MAPBOX_ACCESS_TOKEN || ''
		};
	} catch (error) {
		console.error('Error fetching Wisconsin Watch stories:', error);
		return { stories: [], mapboxToken: MAPBOX_ACCESS_TOKEN || '' };
	}
}
