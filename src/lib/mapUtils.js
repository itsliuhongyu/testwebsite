/**
 * Utility functions for initializing MapLibre district maps with PMTiles
 */
import maplibregl from 'maplibre-gl';
import { Protocol, PMTiles } from 'pmtiles';
import { base } from '$app/paths';

// Register PMTiles protocol with MapLibre once
let protocolRegistered = false;
function ensurePMTilesProtocol() {
    if (!protocolRegistered) {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        protocolRegistered = true;
    }
}

/**
 * Build absolute pmtiles:// URL from a relative path
 */
function buildPMTilesUrl(relativePath) {
    const origin = window.location.origin;
    return `pmtiles://${origin}${relativePath}`;
}

/**
 * Initialize a district map showing all districts with one highlighted
 * Used on the main search page
 * @param {string} containerId - DOM element ID
 * @param {string} pmtilesPath - Relative path to PMTiles file, e.g. '/map-pmtiles/WI_Assembly_Districts_2026.pmtiles'
 * @param {string} propertyKey - Property name for district number in the tileset
 * @param {string|number} districtNumber - The district number to highlight
 */
export async function initializeDistrictMap(containerId, pmtilesPath, propertyKey, districtNumber) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[MapUtils] Container not found: ${containerId}`);
        return null;
    }
    
    console.log(`[MapUtils] Initializing map: ${containerId}, district: ${districtNumber}`);
    ensurePMTilesProtocol();
    
    // Inspect PMTiles metadata to get actual layer names
    const pmtilesUrl = `${window.location.origin}${pmtilesPath}`;
    const pmtiles = new PMTiles(pmtilesUrl);
    const metadata = await pmtiles.getMetadata();
    
    // Get the actual source layer name from vector_layers
    let actualSourceLayer = propertyKey;
    if (metadata.vector_layers && metadata.vector_layers.length > 0) {
        actualSourceLayer = metadata.vector_layers[0].id;
    }

    const map = new maplibregl.Map({
        container: containerId,
        style: {
            'version': 8,
            'sources': {
                'districts': {
                    'type': 'vector',
                    'url': buildPMTilesUrl(pmtilesPath)
                }
            },
            'layers': [
                {
                    'id': 'background',
                    'type': 'background',
                    'paint': {
                        'background-color': '#FFFFFF'
                    }
                }
            ]
        },
        center: [-89.6, 44.8], // Center of Wisconsin
        zoom: 6,
        interactive: false, // Disable zooming and panning
        attributionControl: false, // Hide MapLibre attribution
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
        if (e.sourceId === 'districts' && e.isSourceLoaded && !map.getLayer('districts-fill')) {
            // Convert district number to string for comparison (properties are strings in the data)
            const districtStr = String(districtNumber);
            
            // Add layer for all districts
                map.addLayer({
                    'id': 'districts-fill',
                    'type': 'fill',
                    'source': 'districts',
                    'source-layer': actualSourceLayer,
                    'paint': {
                        'fill-color': '#D5E2EE',
                        'fill-opacity': 1
                    }
                });

                // Add border for all districts
                map.addLayer({
                    'id': 'districts-outline',
                    'type': 'line',
                    'source': 'districts',
                    'source-layer': actualSourceLayer,
                    'paint': {
                        'line-color': '#FFFFFF',
                        'line-width': 0.2
                    }
                });

                // Add layer for selected district (blue fill)
                map.addLayer({
                    'id': 'selected-district',
                    'type': 'fill',
                    'source': 'districts',
                    'source-layer': actualSourceLayer,
                    'paint': {
                        'fill-color': '#0073aa',
                        'fill-opacity': 1,
                    },
                    'filter': ['==', ['get', propertyKey], districtStr]
                });

                // Add stroke for selected district
                map.addLayer({
                    'id': 'selected-district-stroke',
                    'type': 'line',
                    'source': 'districts',
                    'source-layer': actualSourceLayer,
                    'paint': {
                        'line-color': '#233166',
                        'line-width': 1
                    },
                    'filter': ['==', ['get', propertyKey], districtStr]
                });

        }
    });

    map.on('error', (e) => {
        console.error(`[MapUtils] Map error for ${containerId}:`, e);
    });

    return map;
}

/**
 * Initialize a single district map with a light basemap style
 * Used on individual race detail pages
 * @param {string} containerId - DOM element ID
 * @param {string} pmtilesPath - Relative path to PMTiles file
 * @param {string} propertyKey - Property name for district number
 * @param {string|number} districtNumber - The district number to show
 */
export async function initializeSingleDistrictMap(containerId, pmtilesPath, propertyKey, districtNumber) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    ensurePMTilesProtocol();
    
    // Inspect PMTiles metadata to get actual layer names
    const pmtilesUrl = `${window.location.origin}${pmtilesPath}`;
    console.log(`[MapUtils] Fetching metadata from: ${pmtilesUrl}`);
    const pmtiles = new PMTiles(pmtilesUrl);
    const metadata = await pmtiles.getMetadata();
    
    // Get the actual source layer name from vector_layers
    let actualSourceLayer = propertyKey;
    if (metadata.vector_layers && metadata.vector_layers.length > 0) {
        actualSourceLayer = metadata.vector_layers[0].id;
    }
    console.log(`[MapUtils] Source layer: ${actualSourceLayer}, Property: ${propertyKey}, District: ${districtNumber}`);

    try {
        const map = new maplibregl.Map({
            container: containerId,
            style: `${base}/map-pmtiles/maptile_style.json`,
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
            const pmtilesSourceUrl = buildPMTilesUrl(pmtilesPath);
            console.log(`[MapUtils] Adding districts source with URL: ${pmtilesSourceUrl}`);
            map.addSource('districts', {
                'type': 'vector',
                'url': pmtilesSourceUrl
            });
        });
        
        map.on('sourcedata', (e) => {
            if (e.sourceId === 'districts' && e.isSourceLoaded && !map.getLayer('district-fill')) {
                console.log(`[MapUtils] Districts source loaded, adding layers`);
                // Convert district number to string for comparison (properties are strings in the data)
                const districtStr = String(districtNumber);
                
                // Add fill layer for the district
                map.addLayer({
                    'id': 'district-fill',
                    'type': 'fill',
                    'source': 'districts',
                    'source-layer': actualSourceLayer,
                    'paint': {
                        'fill-color': '#0073aa',
                        'fill-opacity': 0.5
                    },
                    'filter': ['==', ['get', propertyKey], districtStr]
                });
                console.log(`[MapUtils] Added district-fill layer with filter: ${propertyKey} == ${districtStr}`);
                
                // Add outline layer for the district
                map.addLayer({
                    'id': 'district-outline',
                    'type': 'line',
                    'source': 'districts',
                    'source-layer': actualSourceLayer,
                    'paint': {
                        'line-color': '#0073aa',
                        'line-width': 2
                    },
                    'filter': ['==', ['get', propertyKey], districtStr]
                });
                console.log(`[MapUtils] Added district-outline layer`);
                
                // Zoom to fit the district after layers are rendered
                setTimeout(() => {
                    // Use querySourceFeatures instead of queryRenderedFeatures to get all features
                    // regardless of current viewport
                    const features = map.querySourceFeatures('districts', {
                        sourceLayer: actualSourceLayer,
                        filter: ['==', ['get', propertyKey], districtStr]
                    });
                    console.log(`[MapUtils] Found ${features?.length || 0} features for zoom calculation`);
                    if (features && features.length > 0) {
                        // Calculate bounds from all features
                        const bounds = new maplibregl.LngLatBounds();
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
                        
                        console.log(`[MapUtils] Fitting map to bounds`);
                        // Fit map to district bounds with padding
                        map.fitBounds(bounds, {
                            padding: 20,
                            animate: false
                        });
                    } else {
                        console.warn(`[MapUtils] No features found to zoom to`);
                    }
                }, 500);
            }
        });
        
        return map;
    } catch (error) {
        console.error('Error loading map:', error);
        return null;
    }
}
