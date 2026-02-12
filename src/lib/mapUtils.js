/**
 * Utility functions for initializing Mapbox district maps
 */

/**
 * Initialize a district map showing all districts with one highlighted
 * Used on the main search page
 */
export function initializeDistrictMap(containerId, tilesetId, propertyKey, districtNumber) {
    const container = document.getElementById(containerId);
    if (!container || typeof mapboxgl === 'undefined') return null;

    const map = new mapboxgl.Map({
        container: containerId,
        style: {
            'version': 8,
            'sources': {
                'districts': {
                    'type': 'vector',
                    'url': `mapbox://${tilesetId}`
                }
            },
            'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
            'layers': []
        },
        center: [-89.6, 44.8], // Center of Wisconsin
        zoom: 6,
        interactive: false, // Disable zooming and panning
        attributionControl: false,
        preserveDrawingBuffer: true
    });

    // Function to fit bounds
    const fitMapBounds = () => {
        map.fitBounds([
            [-92.889, 42.491], // Southwest corner (full WI extent)
            [-86.249, 47.309]  // Northeast corner (full WI extent)
        ], {
            padding: 5,
            animate: false
        });
    };

    // Fit map to Wisconsin bounds when loaded
    map.on('load', fitMapBounds);

    // Add resize observer to handle viewport changes
    const resizeObserver = new ResizeObserver(() => {
        map.resize();
        fitMapBounds();
    });
    resizeObserver.observe(container);

    // Also listen to window resize as fallback
    const handleResize = () => {
        map.resize();
        fitMapBounds();
    };
    window.addEventListener('resize', handleResize);

    // Store cleanup function
    map._cleanup = () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
    };

    map.on('sourcedata', (e) => {
        if (e.sourceId === 'districts' && e.isSourceLoaded) {
            const source = map.getSource('districts');
            console.log(`[MapUtils] Source loaded for ${containerId}, vectorLayerIds:`, source?.vectorLayerIds);
            
            // Get the actual source-layer name from the loaded tileset
            if (source && source.vectorLayerIds && source.vectorLayerIds.length > 0) {
                const sourceLayerName = source.vectorLayerIds[0];
                const districtNum = parseInt(districtNumber);
                
                // Check if layers already exist to avoid duplicate addition
                if (!map.getLayer('districts-fill')) {
                    console.log(`[MapUtils] Adding layers for ${containerId}, sourceLayer: ${sourceLayerName}, filtering by id: ${districtNum}`);
                    // Add layer for all districts (white fill)
                    map.addLayer({
                        'id': 'districts-fill',
                        'type': 'fill',
                        'source': 'districts',
                        'source-layer': sourceLayerName,
                        'paint': {
                            'fill-color': '#ffffff',
                            'fill-opacity': 1
                        }
                    });

                    // Add layer for selected district (blue fill)
                    map.addLayer({
                        'id': 'selected-district',
                        'type': 'fill',
                        'source': 'districts',
                        'source-layer': sourceLayerName,
                        'paint': {
                            'fill-color': '#0073aa',
                            'fill-opacity': 0.8
                        },
                        'filter': ['==', ['get', 'FID'], districtNum]
                    });

                    // Add border for all districts
                    map.addLayer({
                        'id': 'districts-outline',
                        'type': 'line',
                        'source': 'districts',
                        'source-layer': sourceLayerName,
                        'paint': {
                            'line-color': '#000000',
                            'line-width': 0.5
                        }
                    });
                }
            }
        }
    });

    return map;
}

/**
 * Initialize a single district map with custom background style
 * Used on individual race detail pages
 */
export async function initializeSingleDistrictMap(containerId, tilesetId, propertyKey, districtNumber, accessToken, customStyleId = 'mapbox/light-v11') {
    const container = document.getElementById(containerId);
    if (!container || typeof mapboxgl === 'undefined') return null;

    try {
        const map = new mapboxgl.Map({
            container: containerId,
            style: `mapbox://styles/${customStyleId}`,
            center: [-89.6, 44.8],
            zoom: 6,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true
        });
        
        map.on('error', (e) => {
            console.error(`[MapUtils] Map error for ${containerId}:`, e);
        });
        
        map.on('load', () => {
            map.addSource('districts', {
                'type': 'vector',
                'url': `mapbox://${tilesetId}`
            });
        });
        
        map.on('sourcedata', (e) => {
            if (e.sourceId === 'districts' && e.isSourceLoaded) {
                const source = map.getSource('districts');
                
                if (source && source.vectorLayerIds && source.vectorLayerIds.length > 0) {
                    const sourceLayerName = source.vectorLayerIds[0];
                    const districtNum = parseInt(districtNumber);
                    
                    if (!map.getLayer('district-fill')) {
                        // Add fill layer for the district
                        map.addLayer({
                            'id': 'district-fill',
                            'type': 'fill',
                            'source': 'districts',
                            'source-layer': sourceLayerName,
                            'paint': {
                                'fill-color': '#0073aa',
                                'fill-opacity': 0.6
                            },
                            'filter': ['==', ['get', 'FID'], districtNum]
                        });
                        
                        // Add outline layer for the district
                        map.addLayer({
                            'id': 'district-outline',
                            'type': 'line',
                            'source': 'districts',
                            'source-layer': sourceLayerName,
                            'paint': {
                                'line-color': '#0073aa',
                                'line-width': 3
                            },
                            'filter': ['==', ['get', 'FID'], districtNum]
                        });
                        
                        // Use idle event to ensure tiles are loaded before querying
                        map.once('idle', () => {
                            const features = map.querySourceFeatures('districts', {
                                sourceLayer: sourceLayerName,
                                filter: ['==', ['get', 'FID'], districtNum]
                            });
                            
                            if (features.length > 0) {
                                const bounds = new mapboxgl.LngLatBounds();
                                features.forEach(feature => {
                                    if (feature.geometry.type === 'Polygon') {
                                        feature.geometry.coordinates[0].forEach(coord => {
                                            bounds.extend(coord);
                                        });
                                    } else if (feature.geometry.type === 'MultiPolygon') {
                                        feature.geometry.coordinates.forEach(polygon => {
                                            polygon[0].forEach(coord => {
                                                bounds.extend(coord);
                                            });
                                        });
                                    }
                                });
                                map.fitBounds(bounds, { padding: 40, animate: false });
                            } else {
                                // Fallback to Wisconsin bounds if no features found
                                map.fitBounds([
                                    [-92.889, 42.491],
                                    [-86.249, 47.309]
                                ], {
                                    padding: 20,
                                    animate: false
                                });
                            }
                        });
                    }
                }
            }
        });
        
        return map;
    } catch (error) {
        console.error('Error loading map:', error);
        return null;
    }
}
