import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ fetch, setHeaders }) {
	try {
		// Cache for 5 minutes to avoid hammering the RSS feed
		setHeaders({
			'Cache-Control': 'public, max-age=300'
		});
		
		const response = await fetch('https://wisconsinwatch.org/tag/election-2026/feed/');
		
		if (!response.ok) {
			throw new Error(`Failed to fetch RSS feed: ${response.status}`);
		}
		
		const xmlText = await response.text();
		
		// Parse RSS XML to extract stories
		const itemRegex = /<item>([\s\S]*?)<\/item>/g;
		const items = [...xmlText.matchAll(itemRegex)].slice(0, 6); // Get first 6 items
		
		const stories = items.map((match, index) => {
			const itemContent = match[1];
			
			// Extract title
			const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
			const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 'Untitled';
			
			// Extract link/url
			const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
			const url = linkMatch ? linkMatch[1].trim() : '';
			
			// Extract guid for id (fallback to url or index)
			const guidMatch = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/);
			const id = guidMatch ? guidMatch[1].trim() : (url || `story-${index}`);
			
			// Extract dc:creator (author)
			const creatorMatch = itemContent.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>|<dc:creator>(.*?)<\/dc:creator>/);
			const creator = creatorMatch ? (creatorMatch[1] || creatorMatch[2]) : '';
			
			// Extract pubDate
			const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
			const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
			
			// Extract cover image from content:encoded
			let image = '';
			let imageAlt = '';
			let imageSrcset = '';
			let imageSizes = '';
			let imageWidth = '';
			let imageHeight = '';
			
			// Get content:encoded which has the full HTML
			const contentMatch = itemContent.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
			if (contentMatch) {
				const content = contentMatch[1];
				
				// Look for the first <figure><img> with wp-post-image class (this is the cover image)
				const coverImageMatch = content.match(/<figure[^>]*>[\s\S]*?<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*>[\s\S]*?<\/figure>/);
				if (coverImageMatch) {
					const imageBlock = coverImageMatch[0];
					
					// Extract src
					const srcMatch = imageBlock.match(/src=["']([^"']+)["']/);
					if (srcMatch) image = srcMatch[1];
					
					// Extract alt
					const altMatch = imageBlock.match(/alt=["']([^"']+)["']/);
					if (altMatch) imageAlt = altMatch[1];
					
					// Extract srcset
					const srcsetMatch = imageBlock.match(/srcset=["']([^"']+)["']/);
					if (srcsetMatch) imageSrcset = srcsetMatch[1];
					
					// Extract sizes
					const sizesMatch = imageBlock.match(/sizes=["']([^"']+)["']/);
					if (sizesMatch) imageSizes = sizesMatch[1];
					
					// Extract width
					const widthMatch = imageBlock.match(/width=["']?(\d+)["']?/);
					if (widthMatch) imageWidth = widthMatch[1];
					
					// Extract height
					const heightMatch = imageBlock.match(/height=["']?(\d+)["']?/);
					if (heightMatch) imageHeight = heightMatch[1];
				}
			}
			
			// Fallback to media tags if cover image not found
			if (!image) {
				const mediaContentMatch = itemContent.match(/<media:content[^>]*url=["']([^"']+)["']/);
				if (mediaContentMatch) {
					image = mediaContentMatch[1];
				} else {
					const mediaThumbnailMatch = itemContent.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/);
					if (mediaThumbnailMatch) {
						image = mediaThumbnailMatch[1];
					} else {
						const enclosureMatch = itemContent.match(/<enclosure[^>]*url=["']([^"']+)["']/);
						if (enclosureMatch) {
							image = enclosureMatch[1];
						}
					}
				}
			}
			
			return { id, title, url, creator, pubDate, image, imageAlt, imageSrcset, imageSizes, imageWidth, imageHeight };
		});
		
		return json(stories);
	} catch (error) {
		console.error('Error fetching RSS feed:', error);
		// Return empty array on error
		return json([]);
	}
}
