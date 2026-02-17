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
                            
                            console.log(`[MapUtils] Found ${features.length} features for district ${districtNum} in tileset ${tilesetId}`);
                            
                            if (features.length > 0) {
                                // Log first feature for debugging
                                console.log('[MapUtils] First feature geometry type:', features[0].geometry.type);
                                console.log('[MapUtils] First feature sample coordinates:', 
                                    features[0].geometry.type === 'Polygon' 
                                        ? features[0].geometry.coordinates[0]?.slice(0, 2)
                                        : features[0].geometry.coordinates[0]?.[0]?.slice(0, 2)
                                );
                                
                                const bounds = new mapboxgl.LngLatBounds();
                                let validCoordsFound = false;
                                
                                features.forEach(feature => {
                                    if (feature.geometry.type === 'Polygon') {
                                        feature.geometry.coordinates[0].forEach((coord, idx) => {
                                            // Log first few coords for debugging
                                            if (idx < 3) {
                                                console.log(`[MapUtils] Polygon coord ${idx}:`, coord, 'isArray:', Array.isArray(coord), 'length:', coord?.length);
                                            }
                                            // Validate coordinates before extending
                                            if (Array.isArray(coord) && coord.length >= 2 && 
                                                !isNaN(coord[0]) && !isNaN(coord[1]) &&
                                                isFinite(coord[0]) && isFinite(coord[1])) {
                                                bounds.extend(coord);
                                                validCoordsFound = true;
                                            }
                                        });
                                    } else if (feature.geometry.type === 'MultiPolygon') {
                                        feature.geometry.coordinates.forEach(polygon => {
                                            polygon[0].forEach((coord, idx) => {
                                                // Log first few coords for debugging
                                                if (idx < 3) {
                                                    console.log(`[MapUtils] MultiPolygon coord ${idx}:`, coord, 'isArray:', Array.isArray(coord), 'length:', coord?.length);
                                                }
                                                // Validate coordinates before extending
                                                if (Array.isArray(coord) && coord.length >= 2 && 
                                                    !isNaN(coord[0]) && !isNaN(coord[1]) &&
                                                    isFinite(coord[0]) && isFinite(coord[1])) {
                                                    bounds.extend(coord);
                                                    validCoordsFound = true;
                                                }
                                            });
                                        });
                                    }
                                });
                                
                                console.log('[MapUtils] validCoordsFound:', validCoordsFound);
                                console.log('[MapUtils] bounds:', bounds);
                                console.log('[MapUtils] bounds SW:', bounds.getSouthWest());
                                console.log('[MapUtils] bounds NE:', bounds.getNorthEast());
                                
                                if (validCoordsFound) {
                                    // Defer fitBounds to avoid calling it during idle event handler
                                    // This prevents camera calculation issues that can cause NaN errors
                                    setTimeout(() => {
                                        try {
                                            // Double-check map and container are in valid state
                                            const container = map.getContainer();
                                            const containerSize = { width: container.clientWidth, height: container.clientHeight };
                                            console.log('[MapUtils] Container size:', containerSize);
                                            console.log('[MapUtils] Map loaded:', map.loaded());
                                            
                                            if (containerSize.width > 0 && containerSize.height > 0) {
                                                // Convert bounds to array format which is more reliable
                                                const sw = bounds.getSouthWest();
                                                const ne = bounds.getNorthEast();
                                                const boundsArray = [[sw.lng, sw.lat], [ne.lng, ne.lat]];
                                                console.log('[MapUtils] Fitting to bounds array:', boundsArray);
                                                map.fitBounds(boundsArray, { padding: 40, animate: false });
                                            } else {
                                                console.error('[MapUtils] Invalid container size, cannot fit bounds');
                                            }
                                        } catch (err) {
                                            console.error('[MapUtils] Error fitting bounds:', err);
                                            console.error('[MapUtils] Bounds object:', bounds);
                                        }
                                    }, 0);
                                } else {
                                    console.warn(`[MapUtils] No valid coordinates found for district ${districtNum}, using Wisconsin bounds`);
                                    setTimeout(() => {
                                        map.fitBounds([
                                            [-92.889, 42.491],
                                            [-86.249, 47.309]
                                        ], {
                                            padding: 20,
                                            animate: false
                                        });
                                    }, 0);
                                }
                            } else {
                                console.warn(`[MapUtils] No features found for district ${districtNum}, using Wisconsin bounds`);
                                // Fallback to Wisconsin bounds if no features found
                                // Defer fitBounds to avoid calling it during idle event handler
                                setTimeout(() => {
                                    map.fitBounds([
                                        [-92.889, 42.491],
                                        [-86.249, 47.309]
                                    ], {
                                        padding: 20,
                                        animate: false
                                    });
                                }, 0);
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
