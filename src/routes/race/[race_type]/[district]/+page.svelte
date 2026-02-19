<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    {#if config.hasMap}
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
        <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
    {/if}
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRaceByRaceId, getCandidateByCandidateId, getStoriesByRaceId } from '$lib/googleSheets.js';
    import { initializeSingleDistrictMap } from '$lib/mapUtils.js';
    import { saveSourceRace, clearSourceRace } from '$lib/raceStorage.js';
    
    export let data;
    
    // District-based race configurations (these have maps and happens every two years)
    const DISTRICT_RACE_CONFIG = {
        assembly: {
            displayName: 'Wisconsin State Assembly',
            raceType: 'Assembly',
            hasMap: true,
            mapTilesetId: 'wisconsinwatch.6gs2v405',
            mapSourceLayer: 'ASM2024',
            urlPath: 'assembly'
        },
        congress: {
            displayName: 'U.S. House of Representatives',
            raceType: 'US Congress',
            hasMap: true,
            mapTilesetId: 'wisconsinwatch.5mz9q1z2',
            mapSourceLayer: 'CON2021',
            urlPath: 'congress'
        },
        senate: {
            displayName: 'Wisconsin State Senate',
            raceType: 'Senate',
            hasMap: true,
            mapTilesetId: 'wisconsinwatch.7scp33x9',
            mapSourceLayer: 'SEN2024',
            urlPath: 'senate'
        }
    };
    
    /**
     * Generate configuration for a statewide race
     * @param {string} raceTypeSlug - URL slug like 'governor', 'attorney-general'
     * @returns {Object} Configuration object
     */
    function generateStatewideConfig(raceTypeSlug) {
        // Convert slug to proper case for display
        const displayName = raceTypeSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return {
            displayName: `Wisconsin ${displayName} Race`,
            raceType: displayName,
            hasMap: false,
            urlPath: raceTypeSlug
        };
    }
    
    let race = null;
    let candidates = [];
    let stories = [];
    let loading = true;
    let error = null;
    let pymChild;
    let contentDiv;
    let districtMap = null;
    let config = null;
    let raceTypeParam = '';
    let previousRaceType = '';
    let previousDistrict = '';
    
    // Get race configuration based on URL parameter
    $: {
        raceTypeParam = $page.params.race_type;
        
        // Check if it's a district-based race first
        if (DISTRICT_RACE_CONFIG[raceTypeParam]) {
            config = DISTRICT_RACE_CONFIG[raceTypeParam];
        } else {
            // Assume it's a statewide race and generate config dynamically
            config = generateStatewideConfig(raceTypeParam);
        }
    }
    
    function navigateToCandidate(candidateId) {
        if (race && config) {
            saveSourceRace(raceTypeParam, race['race-id']);
            goto(`${base}/race/${raceTypeParam}/candidate/${candidateId}`);
        }
    }
    
    async function loadRaceData() {
        try {
            if (!config) {
                error = 'Invalid race type';
                loading = false;
                return;
            }
            
            let raceId = $page.params.district;
            
            // For statewide races, we might need to find the actual race-id
            // Since we're passing '1' but the sheet might use 'go-1', 'ag-1', etc.
            if (!config.hasMap && raceId === '1') {
                // Fetch all races of this type and get the first one
                // We'll use the raceType from config to query the right sheet
                const races = await import('$lib/googleSheets.js').then(m => m.fetchRacesFromAPI(config.raceType));
                if (races && races.length > 0) {
                    // Use the first race's race-id
                    race = races[0];
                } else {
                    error = 'Race not found';
                    loading = false;
                    return;
                }
            } else {
                // For district races or if we have a specific race-id, use the normal flow
                race = await getRaceByRaceId(raceId, config.raceType);
            }
            
            if (!race) {
                error = 'Race not found';
                loading = false;
                return;
            }
            
            // Load up to 5 candidates if they exist
            candidates = [];
            for (let i = 1; i <= 5; i++) {
                const candidateKey = `candidate-${i}`;
                if (race[candidateKey]) {
                    const candidate = await getCandidateByCandidateId(race[candidateKey], config.raceType);
                    if (candidate) {
                        candidates.push(candidate);
                    }
                }
            }
            
            // Load stories for this race
            stories = await getStoriesByRaceId(raceId);
            
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
            console.error('Error fetching race:', err);
        }
    }
    
    async function initializeDistrictMap() {
        if (!race || !config || !config.hasMap || typeof mapboxgl === 'undefined') return;
        
        const accessToken = data.mapboxToken;
        if (!accessToken) return;
        
        // Check if district-number exists and is valid
        if (!race['district-number']) {
            console.error('District number is missing from race data:', race);
            return;
        }
        
        mapboxgl.accessToken = accessToken;
        
        districtMap = await initializeSingleDistrictMap(
            'district-map',
            config.mapTilesetId,
            config.mapSourceLayer,
            race['district-number'],
            accessToken
        );
    }
    
    // Reactive statement to reload data when URL params change
    $: {
        const currentRaceType = $page.params.race_type;
        const currentDistrict = $page.params.district;
        
        // Only reload if parameters actually changed
        if (currentRaceType !== previousRaceType || currentDistrict !== previousDistrict) {
            previousRaceType = currentRaceType;
            previousDistrict = currentDistrict;
            
            // Clean up existing map before loading new data
            if (districtMap) {
                districtMap.remove();
                districtMap = null;
            }
            
            // Reset state
            loading = true;
            error = null;
            
            // Clear source race when arriving at race page
            clearSourceRace();
            
            loadRaceData().then(() => {
                // Initialize map after race data is loaded
                if (config && config.hasMap) {
                    setTimeout(initializeDistrictMap, 100);
                }
            });
        }
    }
    
    onMount(() => {
        // Initialize Pym.js for iframe embedding
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
    });
    
    onDestroy(() => {
        if (districtMap) {
            districtMap.remove();
        }
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });
    
    $: if (pymChild && pymChild.sendHeight) {
        pymChild.sendHeight();
    }
</script>

<div id="content" class="site-content" bind:this={contentDiv}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
            {#if loading}
                <div class="loading-message">
                    <p>Loading race information...</p>
                </div>
            {:else if error}
                <div class="error-message">
                    <p>Error: {error}</p>
                </div>
            {:else if race && config}
                <div class="race-detail">
                    <button class="back-button" on:click={() => goto(`${base}/`)}>
                        <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home
                    </button>
                    
                    <div class="race-header">
                        <h1>{config.displayName}</h1>
                        {#if config.hasMap && race['district-number']}
                            <h2 class="district-number">District {race['district-number']}</h2>
                            <div id="district-map" class="district-map"></div>
                        {/if}
                    </div>
                    
                    {#if raceTypeParam === 'governor' && race['district-race-nutshell']}
                        <div class="info-section">
                            <h2>Race Overview</h2>
                            <p>{@html race['district-race-nutshell'].replace(/\n/g, '<br>')}</p>
                        </div>
                    {/if}
                    
                    {#if candidates.length > 0}
                        <div class="info-section">
                            <h2>Candidates</h2>
                            <div class="candidates-grid">
                                {#each candidates as candidate}
                                    <div class="candidate-card" role="button" tabindex="0" 
                                         on:click={() => navigateToCandidate(candidate.candidate_id)} 
                                         on:keydown={(e) => e.key === 'Enter' && navigateToCandidate(candidate.candidate_id)}>
                                        <div class="candidate-icon">
                                            <img src="{base}/graphics/plus.svg" alt="View details" />
                                        </div>
                                        {#if candidate.candidate_id}
                                            <img src="{base}/graphics/candidates/{candidate.candidate_id}.jpg" alt={candidate.name} class="candidate-photo" />
                                        {:else}
                                            <div class="candidate-placeholder">?</div>
                                        {/if}
                                        <div class="candidate-info">
                                            <p class="candidate-name">{candidate.name}</p>
                                            {#if candidate.party}
                                                <p class="candidate-party">{candidate.party}</p>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    
                    {#if raceTypeParam !== 'governor'}
                        {#if race['district-info']}
                            <div class="info-section">
                                <h2>District Overview</h2>
                                <p>{race['district-info']}</p>
                            </div>
                        {/if}
                        
                        {#if race['district-race-nutshell']}
                            <div class="info-section">
                                <h2>Race Overview</h2>
                                <div style="white-space: pre-wrap;">{race['district-race-nutshell']}</div>
                            </div>
                        {/if}
                        
                        {#if race['primary-results']}
                            <div class="info-section">
                                <h2>Primary Results</h2>
                                <p>{race['primary-results']}</p>
                            </div>
                        {/if}
                        
                        {#if race['key-races']}
                            <div class="info-section">
                                <h2>Key Race Information</h2>
                                <p>{race['key-races']}</p>
                            </div>
                        {/if}
                    {/if}
                    
                    {#if stories.length > 0}
                        <div class="info-section">
                            <h2>More stories here</h2>
                            <div class="stories-list">
                                {#each stories as story}
                                    <div class="story-item">
                                        <a href={story.url} target="_blank" rel="noopener noreferrer" class="story-headline">
                                            {story.headline}
                                        </a>
                                        {#if story.publisher}
                                            <div class="story-publisher">{story.publisher}</div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </main>
    </section>
</div>
