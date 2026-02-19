<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
    <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
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
    
    let race = null;
    let candidates = [];
    let stories = [];
    let loading = true;
    let error = null;
    let pymChild;
    let contentDiv;
    let districtMap = null;
    
    function navigateToCandidate(candidateId) {
        if (race) {
            saveSourceRace('assembly', race['race-id']);
            goto(`${base}/assembly/candidate/${candidateId}`);
        }
    }
    
    async function loadRaceData() {
        try {
            const raceId = $page.params.district; // URL param is 'district' but contains race-id
            race = await getRaceByRaceId(raceId, 'Assembly');
            
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
                    const candidate = await getCandidateByCandidateId(race[candidateKey], 'Assembly');
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
        if (!race || typeof mapboxgl === 'undefined') return;
        
        const accessToken = data.mapboxToken;
        if (!accessToken) return;
        
        mapboxgl.accessToken = accessToken;
        
        districtMap = await initializeSingleDistrictMap(
            'district-map',
            'wisconsinwatch.6gs2v405',
            'ASM2024',
            race['district-number'],
            accessToken
        );
    }
    
    onMount(() => {
        // Clear source race when arriving at race page
        clearSourceRace();
        
        loadRaceData().then(() => {
            // Initialize map after race data is loaded
            setTimeout(initializeDistrictMap, 100);
        });
        
        // Initialize Pym.js for iframe embedding
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
        
        // Add padding for masthead

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
            <div class="race-detail">
                <button class="back-button" on:click={() => goto(`${base}/`)}><img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home</button>
                
                {#if loading}
                    <div class="loading-message">
                        <p>Loading race information...</p>
                    </div>
                {:else if error}
                    <div class="error-message">
                        <p>Error: {error}</p>
                    </div>
                {:else if race}
                    <div class="race-header">
                        <h1>Wisconsin State Assembly</h1>
                        {#if race['district-number']}
                            <h2 class="district-number">District {race['district-number']}</h2>
                            <div id="district-map" class="district-map"></div>
                        {/if}
                    </div>
                    
                    {#if candidates.length > 0}
                        <div class="info-section">
                            <h2>Candidates</h2>
                            <div class="candidates-grid">
                                {#each candidates as candidate}
                                    <div class="candidate-card" role="button" tabindex="0" on:click={() => navigateToCandidate(candidate.candidate_id)} on:keydown={(e) => e.key === 'Enter' && navigateToCandidate(candidate.candidate_id)}>
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
                {/if}
            </div>
        </main>
    </section>
</div>
