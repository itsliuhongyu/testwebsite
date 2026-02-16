<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
    <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<style>
    .race-detail {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .race-header {
        text-align: center;
        margin-bottom: 2rem;
        padding: 2rem;
        background-color: #f5f5f5;
        border-radius: 8px;
    }
    
    .district-map {
        width: 100%;
        height: 300px;
        margin-top: 1.5rem;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .race-header h1 {
        margin: 0 0 0.5rem 0;
        color: #0073aa;
    }
    
    .race-header .district-number {
        font-size: 3rem;
        font-weight: bold;
        color: #333;
        margin: 1rem 0;
    }
    
    .info-section {
        margin: 2rem 0;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
    }
    
    .info-section h2 {
        color: #0073aa;
        border-bottom: 2px solid #0073aa;
        padding-bottom: 0.5rem;
        margin-top: 0;
    }
    
    .candidates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }
    
    .candidate-card {
        background-color: white;
        border: 2px solid #0073aa;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
    }
    
    .candidate-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 115, 170, 0.3);
        border-color: #005a87;
    }
    
    .candidate-photo {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 1rem;
    }
    
    .candidate-placeholder {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background-color: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: #999;
        margin-bottom: 1rem;
    }
    
    .candidate-name {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
        margin: 0.5rem 0;
    }
    
    .candidate-party {
        color: #666;
        font-size: 1.1rem;
        margin: 0.25rem 0;
    }
    
    .candidate-occupation {
        color: #777;
        font-size: 0.95rem;
        margin-top: 0.5rem;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .info-label {
        font-weight: bold;
        color: #555;
    }
    
    .info-value {
        color: #333;
    }
    
    .back-button {
        display: inline-block;
        margin-bottom: 1rem;
        padding: 0.75rem 1.5rem;
        background-color: #0073aa;
        color: white !important;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .back-button:hover {
        background-color: #005a87;
    }
    
    .error-message {
        text-align: center;
        padding: 2rem;
        color: red;
    }
    
    .loading-message {
        text-align: center;
        padding: 2rem;
    }
    
    @media (max-width: 768px) {
        .info-grid {
            grid-template-columns: 1fr;
        }
        
        .candidates-grid {
            grid-template-columns: 1fr;
        }
    }
</style>

<script>
    import { base } from '$app/paths';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRaceByRaceId, getCandidateByCandidateId } from '$lib/googleSheets.js';
    import { initializeSingleDistrictMap } from '$lib/mapUtils.js';
    import { saveSourceRace, clearSourceRace } from '$lib/raceStorage.js';
    
    export let data;
    
    let race = null;
    let candidates = [];
    let loading = true;
    let error = null;
    let pymChild;
    let contentDiv;
    let districtMap = null;
    
    function navigateToCandidate(candidateId) {
        if (race) {
            saveSourceRace('assembly', race['race-id']);
            goto(`/assembly/candidate/${candidateId}`);
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
                <button class="back-button" on:click={() => goto('/')}>← Back to Main Page</button>
                
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
                        <div class="district-number">District {race['district-number']}</div>
                        <div id="district-map" class="district-map"></div>
                    </div>
                    
                    {#if candidates.length > 0}
                        <div class="info-section">
                            <h2>Candidates</h2>
                            <div class="candidates-grid">
                                {#each candidates as candidate}
                                    <div class="candidate-card" role="button" tabindex="0" on:click={() => navigateToCandidate(candidate.candidate_id)} on:keydown={(e) => e.key === 'Enter' && navigateToCandidate(candidate.candidate_id)}>
                                        {#if candidate.image}
                                            <img src={candidate.image} alt={candidate.name} class="candidate-photo" />
                                        {:else}
                                            <div class="candidate-placeholder">?</div>
                                        {/if}
                                        <div class="candidate-name">{candidate.name}</div>
                                        {#if candidate.party}
                                            <div class="candidate-party">{candidate.party}</div>
                                        {/if}
                                        {#if candidate.occupation}
                                            <div class="candidate-occupation">{candidate.occupation}</div>
                                        {/if}
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
                {/if}
            </div>
        </main>
    </section>
</div>
